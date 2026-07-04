import React from 'react';

export interface ContributionDay {
  date: string;
  count: number;
  level: number;
}

export interface WidgetMetrics {
  username: string;
  daysRemaining: number;
  progressPercent: number;
  currentStreak: number;
  longestStreak: number;
  totalCommitsThisYear: number;
  last14Days: ContributionDay[];
  last35Days: ContributionDay[];
  todayCommitted: boolean;
}

interface WidgetSimulatorProps {
  metrics: WidgetMetrics;
  size: 'small' | 'medium' | 'large';
}

// Custom SVG Icons matching iOS SFSymbols
export const FlameIcon = ({ tint = '#f78166', size = 16 }: { tint?: string, size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: tint, fill: 'currentColor' }}>
    <path d="M17.6569 11.2929C16.6027 12.1465 15.6667 13.5 15.6667 15.5C15.6667 17.5228 14.0228 19.1667 12 19.1667C9.97715 19.1667 8.33333 17.5228 8.33333 15.5C8.33333 11.5 12 7.5 12 7.5C12 7.5 15.6667 11.5 15.6667 13.5C15.6667 14.5 16.5 14.5 16.5 13.5C16.5 11.5 14.5 9 13.5 8C15.5 8 18.5 10 18.5 13.5C18.5 14.5 18 15.5 17.6569 16.2929M12 2.5C12 2.5 5.5 8.5 5.5 14.5C5.5 18.0899 8.41015 21 12 21C15.5899 21 18.5 18.0899 18.5 14.5C18.5 8.5 12 2.5 12 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const TerminalIcon = ({ tint = '#30a14e', size = 12 }: { tint?: string, size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: tint }}>
    <path d="M4 17L10 11L4 5M12 19H20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const WidgetSimulator: React.FC<WidgetSimulatorProps> = ({ metrics, size }) => {
  const getContributionColor = (level: number) => {
    switch (level) {
      case 1: return '#0e4429';
      case 2: return '#006d32';
      case 3: return '#26a641';
      case 4: return '#39d353';
      default: return '#21262d';
    }
  };

  const currentYear = new Date().getFullYear();

  // Small Widget Layout
  if (size === 'small') {
    return (
      <div 
        className="sim-widget sim-widget-small"
        style={{
          background: 'linear-gradient(135deg, #0b0e14 0%, #161b22 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
          padding: '12px',
          justifyContent: 'space-between',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <TerminalIcon tint="#30a14e" size={10} />
          <span style={{ fontSize: '9px', fontWeight: 600, color: '#8b949e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            @{metrics.username}
          </span>
        </div>

        {/* Big Countdown */}
        <div style={{ display: 'flex', flexDirection: 'column', margin: '4px 0' }}>
          <span style={{ fontSize: '32px', fontWeight: 800, fontFamily: 'monospace', color: '#ffffff', lineHeight: 1.1 }}>
            {metrics.daysRemaining}
          </span>
          <span style={{ fontSize: '8px', fontWeight: 700, color: '#8b949e', letterSpacing: '0.05em' }}>
            DAYS LEFT IN YEAR
          </span>
        </div>

        {/* Streak */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <FlameIcon tint={metrics.todayCommitted ? '#f78166' : '#8b949e'} size={14} />
          <span style={{ fontSize: '11px', fontWeight: 700, color: metrics.todayCommitted ? '#39d353' : '#ffffff' }}>
            {metrics.currentStreak} day streak
          </span>
        </div>
      </div>
    );
  }

  // Medium Widget Layout
  if (size === 'medium') {
    return (
      <div 
        className="sim-widget sim-widget-medium"
        style={{
          background: 'linear-gradient(135deg, #0b0e14 0%, #161b22 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
          padding: '14px',
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}
      >
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', width: '120px', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <TerminalIcon tint="#30a14e" size={10} />
            <span style={{ fontSize: '10px', fontWeight: 600, color: '#8b949e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              @{metrics.username}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'monospace', color: '#ffffff', lineHeight: 1.1 }}>
              {metrics.daysRemaining}
            </span>
            <span style={{ fontSize: '9px', fontWeight: 500, color: '#8b949e' }}>
              days remaining
            </span>
          </div>

          <span style={{ fontSize: '9.5px', color: '#8b949e' }}>
            {metrics.totalCommitsThisYear} commits in {currentYear}
          </span>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, paddingLeft: '16px', justifyContent: 'space-between' }}>
          {/* Streak Head */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FlameIcon tint={metrics.todayCommitted ? '#f78166' : '#8b949e'} size={18} />
            <span style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'monospace', color: '#ffffff' }}>
              {metrics.currentStreak}
            </span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: metrics.todayCommitted ? '#39d353' : '#8b949e' }}>
              day streak
            </span>
          </div>

          {/* Today Status */}
          <span style={{ fontSize: '9.5px', fontWeight: 500, color: metrics.todayCommitted ? '#39d353' : '#f78166', margin: '2px 0' }}>
            {metrics.todayCommitted ? 'Committed today! 🔥' : 'No commits logged today'}
          </span>

          {/* Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '8px', fontWeight: 700, color: '#58a6ff', letterSpacing: '0.05em' }}>
              RECENT ACTIVITY
            </span>
            <div style={{ display: 'flex', gap: '3px' }}>
              {metrics.last14Days.map((day, idx) => (
                <div 
                  key={idx} 
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '2px',
                    backgroundColor: getContributionColor(day.level),
                  }}
                  title={`${day.count} commits on ${day.date}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Large Widget Layout
  return (
    <div 
      className="sim-widget sim-widget-large"
      style={{
        background: 'linear-gradient(135deg, #0b0e14 0%, #161b22 100%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
        padding: '16px',
        justifyContent: 'space-between',
      }}
    >
      {/* Row 1: Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <TerminalIcon tint="#30a14e" size={12} />
        <span style={{ fontSize: '11px', fontWeight: 700, color: '#ffffff' }}>
          GitHub Commit Tracker • @{metrics.username}
        </span>
      </div>

      {/* Row 2: Countdown & Streak */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '32px', fontWeight: 800, fontFamily: 'monospace', color: '#ffffff', lineHeight: 1.1 }}>
            {metrics.daysRemaining}
          </div>
          <div style={{ fontSize: '9px', fontWeight: 600, color: '#8b949e' }}>
            days left in year
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <FlameIcon tint={metrics.todayCommitted ? '#f78166' : '#8b949e'} size={20} />
            <span style={{ fontSize: '32px', fontWeight: 800, fontFamily: 'monospace', color: '#ffffff', lineHeight: 1.1 }}>
              {metrics.currentStreak}
            </span>
          </div>
          <div style={{ fontSize: '9px', fontWeight: 600, color: metrics.todayCommitted ? '#39d353' : '#8b949e' }}>
            current commit streak
          </div>
        </div>
      </div>

      {/* Row 3: Progress Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', fontWeight: 700, color: '#8b949e' }}>
          <span>YEAR ELAPSED PROGRESS</span>
          <span style={{ color: '#ffffff' }}>{metrics.progressPercent}%</span>
        </div>
        <div style={{ width: '100%', height: '6px', borderRadius: '3px', backgroundColor: '#21262d', overflow: 'hidden', position: 'relative' }}>
          <div style={{ width: `${metrics.progressPercent}%`, height: '100%', borderRadius: '3px', backgroundColor: '#30a14e' }} />
        </div>
      </div>

      {/* Row 4: Summary Metrics */}
      <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>{metrics.longestStreak} days</span>
          <span style={{ fontSize: '8px', color: '#8b949e' }}>Longest Streak</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>{metrics.totalCommitsThisYear}</span>
          <span style={{ fontSize: '8px', color: '#8b949e' }}>Commits This Year</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: metrics.todayCommitted ? '#39d353' : '#f78166' }}>
            {metrics.todayCommitted ? 'Done! 🔥' : 'Pending ⏳'}
          </span>
          <span style={{ fontSize: '8px', color: '#8b949e' }}>Today's Commit</span>
        </div>
      </div>

      {/* Row 5: Heatmap Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span style={{ fontSize: '8px', fontWeight: 700, color: '#58a6ff', letterSpacing: '0.05em' }}>
          HEATMAP (PAST 5 WEEKS)
        </span>
        <div style={{ display: 'flex', gap: '3px' }}>
          {Array.from({ length: 5 }).map((_, weekIdx) => (
            <div key={weekIdx} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {Array.from({ length: 7 }).map((_, dayIdx) => {
                const idx = weekIdx * 7 + dayIdx;
                const day = metrics.last35Days[idx];
                return (
                  <div 
                    key={dayIdx} 
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '2px',
                      backgroundColor: day ? getContributionColor(day.level) : '#21262d',
                    }}
                    title={day ? `${day.count} commits on ${day.date}` : 'No activity data'}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
