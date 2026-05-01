import React, { useState } from 'react';
import './SessionControls.css';

interface SessionControlsProps {
  onStartSession: (type: 'focus' | 'break', duration: number) => void;
  isSessionActive: boolean;
}

const SessionControls: React.FC<SessionControlsProps> = ({ onStartSession, isSessionActive }) => {
  const [customMinutes, setCustomMinutes] = useState(25);
  const [sessionType, setSessionType] = useState<'focus' | 'break'>('focus');

  const presets = [
    { label: '10 min', duration: 10 * 60 * 1000, type: 'focus' as const },
    { label: '25 min', duration: 25 * 60 * 1000, type: 'focus' as const },
    { label: '45 min', duration: 45 * 60 * 1000, type: 'focus' as const },
    { label: '5 min break', duration: 5 * 60 * 1000, type: 'break' as const },
  ];

  const handleCustomStart = () => {
    const duration = customMinutes * 60 * 1000;
    onStartSession(sessionType, duration);
  };

  return (
    <div className="session-controls">
      <h3 className="controls-title">Quick Start</h3>
      <div className="preset-buttons">
        {presets.map((preset) => (
          <button
            key={preset.label}
            className={`preset-button ${preset.type}`}
            onClick={() => onStartSession(preset.type, preset.duration)}
            disabled={isSessionActive}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="custom-timer">
        <h3 className="controls-title">Custom Timer</h3>
        <div className="custom-controls">
          <div className="time-input-group">
            <label htmlFor="minutes-input">Minutes:</label>
            <input
              id="minutes-input"
              type="range"
              min="1"
              max="120"
              value={customMinutes}
              onChange={(e) => setCustomMinutes(parseInt(e.target.value))}
              className="minutes-slider"
              disabled={isSessionActive}
            />
            <input
              type="number"
              min="1"
              max="120"
              value={customMinutes}
              onChange={(e) => setCustomMinutes(Math.max(1, Math.min(120, parseInt(e.target.value) || 1)))}
              className="minutes-input"
              disabled={isSessionActive}
            />
            <span className="minutes-label">{customMinutes} min</span>
          </div>

          <div className="session-type-group">
            <label>Type:</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  value="focus"
                  checked={sessionType === 'focus'}
                  onChange={(e) => setSessionType(e.target.value as 'focus' | 'break')}
                  disabled={isSessionActive}
                />
                Focus
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  value="break"
                  checked={sessionType === 'break'}
                  onChange={(e) => setSessionType(e.target.value as 'focus' | 'break')}
                  disabled={isSessionActive}
                />
                Break
              </label>
            </div>
          </div>

          <button
            className={`custom-start-button ${sessionType}`}
            onClick={handleCustomStart}
            disabled={isSessionActive}
          >
            Start {customMinutes} min {sessionType === 'focus' ? 'Focus' : 'Break'}
          </button>
        </div>
      </div>

      <div className="adhd-tips">
        <h4>ADHD Tips:</h4>
        <ul>
          <li>Start with shorter sessions (10-15 min)</li>
          <li>Take regular breaks to prevent burnout</li>
          <li>Use body doubling - work alongside others</li>
        </ul>
      </div>
    </div>
  );
};

export default SessionControls;