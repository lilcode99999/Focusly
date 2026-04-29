import React, { useState, useEffect, useRef } from 'react';
import { FocusSession } from '@/types/focus';
import './Timer.css';

interface TimerProps {
  session: FocusSession | null;
  isRunning: boolean;
  onComplete: () => void;
  onStop: () => void;
}

const Timer: React.FC<TimerProps> = ({ session, isRunning, onComplete, onStop }) => {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (session && isRunning) {
      const elapsed = Date.now() - new Date(session.startTime).getTime();
      const remaining = Math.max(0, session.duration - elapsed);
      setTimeRemaining(remaining);
    } else {
      setTimeRemaining(0);
    }
  }, [session, isRunning]);

  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = Math.max(0, prev - 1000);
          if (newTime === 0) {
            onComplete();
          }
          return newTime;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeRemaining, onComplete]);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    if (!session) return 0;
    return ((session.duration - timeRemaining) / session.duration) * 100;
  };

  return (
    <div className="timer-container">
      <div className="timer-circle">
        <svg className="timer-svg" viewBox="0 0 200 200">
          <circle
            className="timer-track"
            cx="100"
            cy="100"
            r="90"
            fill="none"
            strokeWidth="8"
          />
          <circle
            className="timer-progress"
            cx="100"
            cy="100"
            r="90"
            fill="none"
            strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * 90}`}
            strokeDashoffset={`${2 * Math.PI * 90 * (1 - getProgress() / 100)}`}
            transform="rotate(-90 100 100)"
          />
        </svg>
        <div className="timer-display">
          <div className="timer-time">{formatTime(timeRemaining)}</div>
          {session && (
            <div className="timer-label">
              {session.type === 'focus' ? 'Focus Time' : 'Break Time'}
            </div>
          )}
        </div>
      </div>

      {isRunning && (
        <button className="timer-stop-button" onClick={onStop}>
          Stop Session
        </button>
      )}
    </div>
  );
};

export default Timer;
