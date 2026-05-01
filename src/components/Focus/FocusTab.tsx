import React, { useCallback, useState, useEffect } from 'react';
import Timer from './Timer';
import SessionControls from './SessionControls';
import SessionHistory from './SessionHistory';
import {
  CURRENT_FOCUS_SESSION_STORAGE_KEY,
  FOCUS_SESSIONS_STORAGE_KEY,
  FOCUS_SESSION_SUMMARIES_STORAGE_KEY,
  PENDING_FOCUS_REQUEST_STORAGE_KEY,
} from '@/lib/storageKeys';
import { clearPendingFocusRequest, getPendingFocusRequest } from '@/services/focusRequests';
import { incrementDailyStats } from '@/services/localStats';
import { markOnboardingStep } from '@/services/localOnboarding';
import { FocusRequest, FocusSession, FocusSessionSummary, FocusSessionType } from '@/types/focus';
import './FocusTab.css';

const FocusTab: React.FC = () => {
  const [currentSession, setCurrentSession] = useState<FocusSession | null>(null);
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [completionMessage, setCompletionMessage] = useState('');

  const startSession = useCallback((
    type: FocusSessionType,
    duration: number,
    request?: Partial<FocusRequest>
  ) => {
    const session: FocusSession = {
      id: request?.id || Date.now().toString(),
      startTime: new Date().toISOString(),
      duration,
      type,
      completed: false,
      goal: request?.goal,
      bookmarkId: request?.bookmarkId,
      bookmarkTitle: request?.bookmarkTitle,
      sourceUrl: request?.sourceUrl,
      sourceDomain: request?.sourceDomain,
    };

    setCurrentSession(session);
    setIsTimerRunning(true);
    setCompletionMessage('');
    chrome.storage.local.set({ [CURRENT_FOCUS_SESSION_STORAGE_KEY]: session });
    clearPendingFocusRequest();
    if (type === 'focus' && request?.bookmarkId) {
      void markOnboardingStep('startedFocus');
    }
  }, []);

  const startSessionFromRequest = useCallback((request: FocusRequest) => {
    startSession(request.type, request.duration, request);
  }, [startSession]);

  useEffect(() => {
    const loadFocusState = async () => {
      const result = await chrome.storage.local.get([
        FOCUS_SESSIONS_STORAGE_KEY,
        CURRENT_FOCUS_SESSION_STORAGE_KEY,
      ]);
      const storedSessions = result[FOCUS_SESSIONS_STORAGE_KEY] || [];
      const storedCurrentSession = result[CURRENT_FOCUS_SESSION_STORAGE_KEY];

      setSessions(storedSessions);
      if (storedCurrentSession) {
        setCurrentSession(storedCurrentSession);
        setIsTimerRunning(true);
        return;
      }

      const pendingRequest = await getPendingFocusRequest();
      if (pendingRequest && pendingRequest.autoStart !== false) {
        startSessionFromRequest(pendingRequest);
      }
    };

    loadFocusState();
  }, [startSessionFromRequest]);

  useEffect(() => {
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      const pendingChange = changes[PENDING_FOCUS_REQUEST_STORAGE_KEY];
      if (pendingChange?.newValue && !currentSession) {
        startSessionFromRequest(pendingChange.newValue);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, [currentSession, startSessionFromRequest]);

  const buildSessionSummary = (session: FocusSession, minutes: number, completed: boolean) => {
    if (!completed) {
      return 'Stopped early. Your place is still saved.';
    }

    if (session.goal) {
      return `Nice work. You spent ${minutes} min with "${session.goal}".`;
    }

    return `Nice work. You protected ${minutes} min of focus time.`;
  };

  const endSession = useCallback(async (completed: boolean) => {
    if (currentSession) {
      const endTime = new Date().toISOString();
      const elapsed = Date.now() - new Date(currentSession.startTime).getTime();
      const minutes = completed
        ? Math.max(1, Math.round(currentSession.duration / 60000))
        : Math.max(0, Math.round(elapsed / 60000));
      const summary = buildSessionSummary(currentSession, minutes, completed);
      const updatedSession = {
        ...currentSession,
        endTime,
        completed,
        summary,
      };
      const updatedSessions = [...sessions, updatedSession];
      setSessions(updatedSessions);
      setCurrentSession(null);
      setIsTimerRunning(false);
      setCompletionMessage(summary);

      await chrome.storage.local.set({
        [FOCUS_SESSIONS_STORAGE_KEY]: updatedSessions,
        [CURRENT_FOCUS_SESSION_STORAGE_KEY]: null,
      });

      if (completed && currentSession.type === 'focus') {
        await incrementDailyStats({ focusMinutes: minutes });
        if (currentSession.bookmarkId) {
          await markOnboardingStep('completedFocus');
        }
        const summaryRecord: FocusSessionSummary = {
          id: `${currentSession.id}-summary`,
          sessionId: currentSession.id,
          createdAt: endTime,
          minutes,
          goal: currentSession.goal,
          bookmarkId: currentSession.bookmarkId,
          bookmarkTitle: currentSession.bookmarkTitle,
          completed,
          summary,
        };
        const result = await chrome.storage.local.get([FOCUS_SESSION_SUMMARIES_STORAGE_KEY]);
        const summaries = result[FOCUS_SESSION_SUMMARIES_STORAGE_KEY] || [];
        await chrome.storage.local.set({
          [FOCUS_SESSION_SUMMARIES_STORAGE_KEY]: [...summaries, summaryRecord].slice(-50),
        });
      }
    }
  }, [currentSession, sessions]);

  return (
    <div className="focus-tab">
      <div className="focus-header">
        <h2>Focus Mode</h2>
        <p className="focus-subtitle">
          {currentSession?.goal || 'Stay focused with timed work sessions'}
        </p>
      </div>

      {completionMessage && (
        <div className="completion-message" role="status">
          {completionMessage}
        </div>
      )}

      <Timer
        session={currentSession}
        isRunning={isTimerRunning}
        onComplete={() => endSession(true)}
        onStop={() => endSession(false)}
      />

      <SessionControls
        onStartSession={startSession}
        isSessionActive={isTimerRunning}
      />

      <SessionHistory sessions={sessions} />
    </div>
  );
};

export default FocusTab;
