export type FocusSessionType = 'focus' | 'break';

export interface FocusRequest {
  id: string;
  type: FocusSessionType;
  duration: number;
  goal?: string;
  bookmarkId?: string;
  bookmarkTitle?: string;
  sourceUrl?: string;
  sourceDomain?: string;
  createdAt: string;
  autoStart?: boolean;
}

export interface FocusSession {
  id: string;
  startTime: string;
  endTime?: string;
  duration: number;
  type: FocusSessionType;
  completed: boolean;
  goal?: string;
  bookmarkId?: string;
  bookmarkTitle?: string;
  sourceUrl?: string;
  sourceDomain?: string;
  summary?: string;
}

export interface FocusSessionSummary {
  id: string;
  sessionId: string;
  createdAt: string;
  minutes: number;
  goal?: string;
  bookmarkId?: string;
  bookmarkTitle?: string;
  completed: boolean;
  summary: string;
}
