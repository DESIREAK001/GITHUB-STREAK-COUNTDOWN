import React, { useState } from 'react';
import { FlameIcon } from './WidgetSimulator';
import type { WidgetMetrics } from './WidgetSimulator';

interface DashboardProps {
  metrics: WidgetMetrics;
  onMockCommitsChange: (dateStr: string, commits: number) => void;
  isMockMode: boolean;
  onToggleMode: (isMock: boolean) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  metrics,
  onMockCommitsChange,
  isMockMode,
  onToggleMode
}) => {
  const [hoveredDay, setHoveredDay] = useState<{ date: string; count: number } | null>(null);

  const getContributionColor = (level: number) => {
    switch (level) {
      case 1: return 'var(--gh-l1)';
      case 2: return 'var(--gh-l2)';
      case 3: return 'var(--gh-l3)';
      case 4: return 'var(--gh-l4)';
      default: return 'var(--gh-l0)';
    }
  };


  // Group last35Days into 5 weeks for heatmap preview in stats
  const currentYear = new Date().getFullYear();

  // Handle manual contribution addition in mock mode
  const handleCellClick = (dateStr: string, currentCount: number) => {
    if (!isMockMode) {
      alert("Please switch to 'Simulated Mode' to manually edit commits!");
      return;
    }
    // Toggle between 0, 1, 3, 5, 8 commits
    let nextCommits = 1;
    if (currentCount === 0) nextCommits = 1;
    else if (currentCount === 1) nextCommits = 3;
    else if (currentCount === 3) nextCommits = 5;
    else if (currentCount === 5) nextCommits = 8;
    else nextCommits = 0;

    onMockCommitsChange(dateStr, nextCommits);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        
        {/* Card 1: Days Left */}
        <div className="glass-panel glass-card animate-fade-in" style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: '4px solid var(--accent-blue)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Countdown</span>
          <span style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'monospace', color: '#ffffff', margin: '8px 0' }}>
            {metrics.daysRemaining}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            days left in {currentYear}
          </span>
        </div>

        {/* Card 2: Streak */}
        <div className="glass-panel glass-card animate-fade-in" style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: '4px solid var(--accent-orange)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Streak</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0' }}>
            <FlameIcon tint={metrics.todayCommitted ? '#f78166' : '#8b949e'} size={24} />
            <span style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'monospace', color: '#ffffff' }}>
              {metrics.currentStreak}
            </span>
          </div>
          <span style={{ fontSize: '0.8rem', color: metrics.todayCommitted ? 'var(--accent-green)' : 'var(--text-muted)' }}>
            {metrics.todayCommitted ? 'Committed today! 🔥' : 'Yesterday was active'}
          </span>
        </div>

        {/* Card 3: Max Streak & Commits */}
        <div className="glass-panel glass-card animate-fade-in" style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: '4px solid var(--accent-purple)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Yearly Summary</span>
          <div style={{ margin: '8px 0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Longest Streak:</span>
              <span style={{ fontWeight: 700, color: '#ffffff' }}>{metrics.longestStreak} days</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total Commits:</span>
              <span style={{ fontWeight: 700, color: '#ffffff' }}>{metrics.totalCommitsThisYear}</span>
            </div>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            record data for {currentYear}
          </span>
        </div>

      </div>

      {/* Mode Control Panel */}
      <div className="glass-panel animate-fade-in" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '4px' }}>Simulator Mode</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {isMockMode 
                ? 'Currently editing simulated logs. Click grid cells below to toggle commits.' 
                : `Currently showing live commits for GitHub username: @${metrics.username}`}
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className={`btn ${!isMockMode ? '' : 'btn-secondary'}`} 
              onClick={() => onToggleMode(false)}
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              GitHub Live
            </button>
            <button 
              className={`btn ${isMockMode ? '' : 'btn-secondary'}`} 
              onClick={() => onToggleMode(true)}
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              Simulated Mode
            </button>
          </div>
        </div>
      </div>

      {/* Grid Calendar Visualizer */}
      <div className="glass-panel animate-fade-in" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Commit Calendar</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Visualizing your activity logs. {isMockMode && 'Click squares to add/change commits.'}
            </p>
          </div>
          
          {/* Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span>Less</span>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'var(--gh-l0)' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'var(--gh-l1)' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'var(--gh-l2)' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'var(--gh-l3)' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'var(--gh-l4)' }} />
            <span>More</span>
          </div>
        </div>

        {/* Heatmap Layout (Columns are weeks, rows are days: Sun-Sat) */}
        <div style={{ overflowX: 'auto', paddingBottom: '10px' }}>
          <div style={{ display: 'flex', gap: '3px', minWidth: '700px' }}>
            {/* Day Labels */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', paddingRight: '6px', fontSize: '9px', color: 'var(--text-muted)', justifyContent: 'space-around', height: '88px', width: '24px' }}>
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Render 35 days in detailed grid (5 columns of 7 days) */}
            {Array.from({ length: 5 }).map((_, weekIdx) => (
              <div key={weekIdx} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {Array.from({ length: 7 }).map((_, dayIdx) => {
                  const idx = weekIdx * 7 + dayIdx;
                  const day = metrics.last35Days[idx];
                  if (!day) return null;
                  
                  return (
                    <div
                      key={dayIdx}
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '2px',
                        backgroundColor: getContributionColor(day.level),
                        cursor: isMockMode ? 'pointer' : 'default',
                        border: hoveredDay?.date === day.date ? '1px solid #ffffff' : 'none',
                        boxSizing: 'border-box',
                        transition: 'transform 0.1s ease',
                      }}
                      onClick={() => handleCellClick(day.date, day.count)}
                      onMouseEnter={() => setHoveredDay({ date: day.date, count: day.count })}
                      onMouseLeave={() => setHoveredDay(null)}
                    />
                  );
                })}
              </div>
            ))}

            {/* Spacer */}
            <div style={{ borderLeft: '1px dashed rgba(255,255,255,0.1)', margin: '0 8px' }} />

            {/* Interactive Grid Editor (Shows past 35-70 days for editing in Mock Mode) */}
            {isMockMode && (
              <div style={{ display: 'flex', flex: 1, flexDirection: 'column', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-purple)', marginBottom: '8px' }}>
                  Interactive Simulator Panel
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => {
                      // Set all past 35 days to committed (e.g. 5 commits each)
                      metrics.last35Days.forEach(day => onMockCommitsChange(day.date, 3));
                    }}
                    style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                  >
                    Set Active Streak 🔥
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => {
                      // Set all to 0 commits
                      metrics.last35Days.forEach(day => onMockCommitsChange(day.date, 0));
                    }}
                    style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                  >
                    Clear All Commits ❌
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hover Tooltip display */}
        <div style={{ minHeight: '24px', marginTop: '12px', display: 'flex', alignItems: 'center' }}>
          {hoveredDay ? (
            <span style={{ fontSize: '0.85rem', color: '#ffffff', fontWeight: 500 }}>
              <strong>{hoveredDay.count} commits</strong> on {new Date(hoveredDay.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          ) : (
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Hover over a calendar cell to view contribution details.
            </span>
          )}
        </div>
      </div>

    </div>
  );
};
