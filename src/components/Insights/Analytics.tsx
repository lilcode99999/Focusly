import React from 'react';
import AppIcon from '@/components/common/AppIcon';
import './Analytics.css';

interface AnalyticsProps {
  data: {
    dailyFocusMinutes: number[];
    weeklyBookmarks: number;
    productivityScore: number;
    topTags: { tag: string; count: number }[];
    focusPatterns: {
      morningMinutes: number;
      afternoonMinutes: number;
      eveningMinutes: number;
    };
  };
}

const Analytics: React.FC<AnalyticsProps> = ({ data }) => {
  const getDayLabel = (index: number) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date().getDay();
    return days[(today - 6 + index + 7) % 7];
  };

  const chartMaxMinutes = Math.max(...data.dailyFocusMinutes, 30);

  return (
    <div className="analytics-container">
      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-value">{data.productivityScore}%</div>
          <div className="card-label">Productivity Score</div>
        </div>
        <div className="summary-card">
          <div className="card-value">{data.weeklyBookmarks}</div>
          <div className="card-label">Bookmarks This Week</div>
        </div>
        <div className="summary-card">
          <div className="card-value">
            {Math.round(data.dailyFocusMinutes.reduce((a, b) => a + b, 0) / 7)}
          </div>
          <div className="card-label">Avg Daily Focus (min)</div>
        </div>
      </div>

      {/* Focus Chart */}
      <div className="chart-section">
        <h3>Daily Focus Time</h3>
        <div className="bar-chart">
          {data.dailyFocusMinutes.map((minutes, index) => {
            const dayLabel = getDayLabel(index);
            const barHeight = minutes > 0 ? `${(minutes / chartMaxMinutes) * 100}%` : '0%';

            return (
              <div key={index} className="bar-container" aria-label={`${dayLabel}: ${minutes} focus minutes`}>
                <div className="bar-track">
                  <div
                    className={`bar ${minutes === 0 ? 'bar-empty' : ''}`}
                    style={{ height: barHeight }}
                  >
                    <span className="bar-value">{minutes}</span>
                  </div>
                </div>
                <span className="bar-label">{dayLabel}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Focus Patterns */}
      <div className="patterns-section">
        <h3>Focus Patterns</h3>
        <div className="time-distribution">
          <div className="time-slot">
            <AppIcon className="time-icon" name="sunrise" size={22} />
            <div className="time-info">
              <div className="time-period">Morning</div>
              <div className="time-minutes">{data.focusPatterns.morningMinutes} min</div>
            </div>
          </div>
          <div className="time-slot">
            <AppIcon className="time-icon" name="sun" size={22} />
            <div className="time-info">
              <div className="time-period">Afternoon</div>
              <div className="time-minutes">{data.focusPatterns.afternoonMinutes} min</div>
            </div>
          </div>
          <div className="time-slot">
            <AppIcon className="time-icon" name="moon" size={22} />
            <div className="time-info">
              <div className="time-period">Evening</div>
              <div className="time-minutes">{data.focusPatterns.eveningMinutes} min</div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Tags */}
      {data.topTags.length > 0 && (
        <div className="tags-section">
          <h3>Most Used Tags</h3>
          <div className="top-tags">
            {data.topTags.slice(0, 5).map((item) => (
              <div key={item.tag} className="tag-item">
                <span className="tag-name">{item.tag}</span>
                <span className="tag-count">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
