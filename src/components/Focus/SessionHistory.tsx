import React, { useState } from 'react';
import { FocusSession } from '@/types/focus';
import './SessionHistory.css';

interface SessionHistoryProps {
  sessions: FocusSession[];
}

const SessionHistory: React.FC<SessionHistoryProps> = ({ sessions }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const todaySessions = sessions.filter((session) => {
    const sessionDate = new Date(session.startTime);
    const today = new Date();
    return (
      sessionDate.getDate() === today.getDate() &&
      sessionDate.getMonth() === today.getMonth() &&
      sessionDate.getFullYear() === today.getFullYear()
    );
  });

  const totalFocusTime = todaySessions
    .filter((s) => s.type === 'focus' && s.completed)
    .reduce((total, session) => total + session.duration, 0);

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    return `${minutes} min`;
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="session-history">
      <div className="history-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h3 className="history-title">Today's Sessions</h3>
        <div className="history-stats">
          <span className="total-time">{formatDuration(totalFocusTime)} total</span>
          <span className="toggle-icon">{isExpanded ? '▼' : '▶'}</span>
        </div>
      </div>

      {isExpanded && (
        <div className="session-list">
          {todaySessions.length === 0 ? (
            <p className="empty-sessions">No sessions yet today</p>
          ) : (
            todaySessions.map((session) => (
              <div key={session.id} className="session-item">
                <span className={`session-type ${session.type}`}>
                  {session.type === 'focus' ? '🎯' : '☕'}
                </span>
                <span className="session-time">
                  {formatTime(session.startTime)}
                </span>
                <span className="session-duration">
                  {formatDuration(session.duration)}
                </span>
                <span className={`session-status ${session.completed ? 'completed' : 'incomplete'}`}>
                  {session.completed ? '✓' : '×'}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SessionHistory;
