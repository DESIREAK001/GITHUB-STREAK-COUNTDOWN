import { useState, useEffect, useCallback } from 'react';
import { WidgetSimulator } from './components/WidgetSimulator';
import type { WidgetMetrics, ContributionDay } from './components/WidgetSimulator';
import { Dashboard } from './components/Dashboard';
import { CodeExporter } from './components/CodeExporter';

// Default user
const INITIAL_USERNAME = 'octocat';

// Helper to format date as YYYY-MM-DD
const formatDateStr = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Generate realistic mock data for 365 days
const generateMockData = () => {
  const contributions: ContributionDay[] = [];
  const now = new Date();
  
  for (let i = 365; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dStr = formatDateStr(d);
    
    let count = 0;
    let level = 0;
    
    const rand = Math.random();
    if (rand > 0.7) {
      count = Math.floor(Math.random() * 8) + 1;
      if (count <= 2) level = 1;
      else if (count <= 4) level = 2;
      else if (count <= 6) level = 3;
      else level = 4;
    }
    
    contributions.push({ date: dStr, count, level });
  }

  // Inject a solid active streak for the past 6 days
  for (let i = 6; i >= 1; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dStr = formatDateStr(d);
    const idx = contributions.findIndex(c => c.date === dStr);
    if (idx !== -1) {
      contributions[idx] = { date: dStr, count: 3, level: 2 };
    }
  }

  // Make today uncommitted by default (user can toggle it)
  const todayStr = formatDateStr(now);
  const todayIdx = contributions.findIndex(c => c.date === todayStr);
  if (todayIdx !== -1) {
    contributions[todayIdx] = { date: todayStr, count: 0, level: 0 };
  }

  return contributions;
};

export default function App() {
  const [username, setUsername] = useState<string>(INITIAL_USERNAME);
  const [inputUsername, setInputUsername] = useState<string>(INITIAL_USERNAME);
  const [widgetSize, setWidgetSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'code'>('dashboard');
  const [isMockMode, setIsMockMode] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Raw data from GitHub or Mock generator
  const [rawContributions, setRawContributions] = useState<ContributionDay[]>([]);
  // Manual overrides in Mock Mode
  const [mockOverrides, setMockOverrides] = useState<Record<string, number>>({});

  // Fetch GitHub contributions via public API
  const fetchGitHubContributions = useCallback(async (user: string) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch contribution calendar (caches for 1 hour)
      const response = await fetch(`https://github-contributions-api.jogruber.de/v4/${user}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch user. GitHub profile might be private or does not exist.`);
      }
      const data = await response.json();
      
      if (!data.contributions || data.contributions.length === 0) {
        throw new Error("No contributions found for this user.");
      }

      // 2. Query GitHub API events for today (updates instantly)
      let hasRecentActivity = false;
      try {
        const eventsResponse = await fetch(`https://api.github.com/users/${user}/events`);
        if (eventsResponse.ok) {
          const events = await eventsResponse.json();
          if (Array.isArray(events)) {
            const todayStr = formatDateStr(new Date());
            const contribTypes = ["PushEvent", "PullRequestEvent", "IssuesEvent", "CommitCommentEvent"];
            hasRecentActivity = events.some((event: any) => {
              if (!contribTypes.includes(event.type)) return false;
              const eventDateStr = formatDateStr(new Date(event.created_at));
              return eventDateStr === todayStr;
            });
          }
        }
      } catch (eventErr) {
        console.warn("Failed to check real-time events API:", eventErr);
      }

      // Merge results
      const contributionsList = [...data.contributions] as ContributionDay[];
      if (hasRecentActivity) {
        const todayStr = formatDateStr(new Date());
        const todayIdx = contributionsList.findIndex(c => c.date === todayStr);
        if (todayIdx === -1) {
          contributionsList.push({ date: todayStr, count: 1, level: 1 });
        } else if (contributionsList[todayIdx].count === 0) {
          contributionsList[todayIdx] = { date: todayStr, count: 1, level: 1 };
        }
      }
      
      setRawContributions(contributionsList);
      setIsMockMode(false);
    } catch (err: any) {
      setError(err.message || 'Failed to load GitHub data');
      setIsMockMode(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch initial profile on load
  useEffect(() => {
    setRawContributions(generateMockData());
  }, []);

  // Recalculate metrics whenever raw data or overrides change
  const getCalculatedMetrics = (): WidgetMetrics => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

    // Calculate Days Remaining
    const msInDay = 24 * 60 * 60 * 1000;
    const timeDiff = endOfYear.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(timeDiff / msInDay));

    // Progress percentage
    const startOfYear = new Date(currentYear, 0, 1, 0, 0, 0);
    const totalMs = endOfYear.getTime() - startOfYear.getTime();
    const elapsedMs = now.getTime() - startOfYear.getTime();
    const progressPercent = Math.min(100, Math.max(0, Math.round((elapsedMs / totalMs) * 100)));

    const todayStr = formatDateStr(now);
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = formatDateStr(yesterday);

    // Apply mock overrides on top of raw contributions
    const mergedContributions = rawContributions.map(c => {
      if (isMockMode && mockOverrides[c.date] !== undefined) {
        const count = mockOverrides[c.date];
        let level = 0;
        if (count > 0 && count <= 2) level = 1;
        else if (count > 2 && count <= 4) level = 2;
        else if (count > 4 && count <= 6) level = 3;
        else if (count > 6) level = 4;
        return { ...c, count, level };
      }
      return c;
    });

    // Create O(1) map
    const contribMap: Record<string, ContributionDay> = {};
    let totalCommitsThisYear = 0;
    mergedContributions.forEach(c => {
      contribMap[c.date] = c;
      const cYear = new Date(c.date).getFullYear();
      if (cYear === currentYear) {
        totalCommitsThisYear += c.count;
      }
    });

    // Calculate Streak
    let currentStreak = 0;
    const hasCommitsToday = !!(contribMap[todayStr] && contribMap[todayStr].count > 0);
    const hasCommitsYesterday = !!(contribMap[yesterdayStr] && contribMap[yesterdayStr].count > 0);

    if (hasCommitsToday || hasCommitsYesterday) {
      let checkDate = hasCommitsToday ? new Date(now) : new Date(yesterday);
      let checkDateStr = formatDateStr(checkDate);

      while (contribMap[checkDateStr] && contribMap[checkDateStr].count > 0) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
        checkDateStr = formatDateStr(checkDate);
      }
    }

    // Longest Streak
    let longestStreak = 0;
    let tempStreak = 0;
    const sortedContribs = [...mergedContributions].sort((a, b) => a.date.localeCompare(b.date));
    sortedContribs.forEach(c => {
      if (c.count > 0) {
        tempStreak++;
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
      } else {
        tempStreak = 0;
      }
    });

    // Get last 14 days
    const last14Days: ContributionDay[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dStr = formatDateStr(d);
      last14Days.push(contribMap[dStr] || { date: dStr, count: 0, level: 0 });
    }

    // Get last 35 days
    const last35Days: ContributionDay[] = [];
    for (let i = 34; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dStr = formatDateStr(d);
      last35Days.push(contribMap[dStr] || { date: dStr, count: 0, level: 0 });
    }

    return {
      username: isMockMode ? 'simulator' : username,
      daysRemaining,
      progressPercent,
      currentStreak,
      longestStreak,
      totalCommitsThisYear,
      last14Days,
      last35Days,
      todayCommitted: hasCommitsToday
    };
  };

  const handleFetchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUsername.trim() === '') return;
    setUsername(inputUsername.trim());
    fetchGitHubContributions(inputUsername.trim());
  };

  const handleMockCommitsChange = (dateStr: string, count: number) => {
    setMockOverrides(prev => ({
      ...prev,
      [dateStr]: count
    }));
  };

  const handleToggleMode = (isMock: boolean) => {
    setIsMockMode(isMock);
    setError(null);
    if (isMock) {
      if (rawContributions.length === 0) {
        setRawContributions(generateMockData());
      }
    } else {
      fetchGitHubContributions(username);
    }
  };

  const metrics = getCalculatedMetrics();

  // Current local time formatted for the status bar
  const formatTime = () => {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <div className="app-container">
      
      {/* Page Header */}
      <header className="header-section">
        <h1>GitHub Commit Streak & End-of-Year Countdown</h1>
        <p>A premium iOS Scriptable widget and local simulator to track your daily coding streaks</p>
      </header>

      {/* Left Column: Device Simulator & Controls */}
      <aside style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Connection Panel */}
        <div className="glass-panel animate-fade-in">
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '14px' }}>GitHub Profile</h2>
          
          <form onSubmit={handleFetchSubmit} className="input-group">
            <label className="input-label">Enter Username</label>
            <div className="text-input-wrapper">
              <input 
                type="text" 
                className="text-input" 
                value={inputUsername}
                onChange={(e) => setInputUsername(e.target.value)}
                placeholder="e.g., torvalds"
                disabled={loading}
              />
            </div>
            <button type="submit" className="btn" disabled={loading} style={{ width: '100%', marginTop: '6px' }}>
              {loading ? 'Fetching...' : 'Fetch Live Contributions'}
            </button>
          </form>

          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '10px 14px', borderRadius: '8px', fontSize: '0.8rem', color: '#f87171', marginTop: '12px' }}>
              ⚠️ {error}
              <div style={{ marginTop: '4px', fontSize: '0.75rem', opacity: 0.8 }}>
                Switched to Simulated Mode.
              </div>
            </div>
          )}
        </div>

        {/* Home Screen Device Simulator */}
        <div className="glass-panel animate-fade-in" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>iOS Screen Simulator</h2>
            
            {/* Size Selector */}
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', padding: '3px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              {(['small', 'medium', 'large'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => setWidgetSize(size)}
                  style={{
                    background: widgetSize === size ? 'rgba(255,255,255,0.08)' : 'transparent',
                    border: 'none',
                    color: widgetSize === size ? '#ffffff' : 'var(--text-muted)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '4px 8px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    textTransform: 'capitalize'
                  }}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* iPhone Simulator Frame */}
          <div className="phone-shell">
            <div className="phone-screen">
              <div className="phone-island" />
              
              <div className="phone-header">
                <span>{formatTime()}</span>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <span>5G</span>
                  <div style={{ width: '15px', height: '8px', border: '1px solid currentColor', borderRadius: '2px', padding: '1px', display: 'flex' }}>
                    <div style={{ flex: 1, background: 'currentColor', borderRadius: '1px' }} />
                  </div>
                </div>
              </div>

              <div className="phone-widget-area">
                {/* Renders widget preview inside phone screen */}
                <WidgetSimulator metrics={metrics} size={widgetSize} />
                
                {/* Placeholder App Icons */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginTop: '16px', padding: '0 8px' }}>
                  {['App Store', 'GitHub', 'Settings', 'VS Code'].map((name, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <div className="dock-icon" style={{ width: '44px', height: '44px', borderRadius: '11px', fontSize: '1.5rem', background: 'rgba(255,255,255,0.05)' }}>
                        {['🧭', '🛠️', '⚙️', '💻'][i]}
                      </div>
                      <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>{name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* iOS Bottom Dock */}
              <div className="dock">
                {['📞', '✉️', '🌐', '🎵'].map((emoji, i) => (
                  <div key={i} className="dock-icon">{emoji}</div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </aside>

      {/* Right Column: Work Area & Exporter */}
      <main style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', gap: '16px' }}>
          <button
            onClick={() => setActiveTab('dashboard')}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'dashboard' ? '2px solid var(--accent-blue)' : '2px solid transparent',
              color: activeTab === 'dashboard' ? '#ffffff' : 'var(--text-muted)',
              fontSize: '1rem',
              fontWeight: 600,
              padding: '8px 4px 12px 4px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Dashboard & Heatmap
          </button>
          <button
            onClick={() => setActiveTab('code')}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'code' ? '2px solid var(--accent-blue)' : '2px solid transparent',
              color: activeTab === 'code' ? '#ffffff' : 'var(--text-muted)',
              fontSize: '1rem',
              fontWeight: 600,
              padding: '8px 4px 12px 4px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Scriptable Setup (iOS Code)
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === 'dashboard' ? (
          <Dashboard 
            metrics={metrics}
            onMockCommitsChange={handleMockCommitsChange}
            isMockMode={isMockMode}
            onToggleMode={handleToggleMode}
          />
        ) : (
          <CodeExporter username={username} />
        )}

      </main>

    </div>
  );
}
