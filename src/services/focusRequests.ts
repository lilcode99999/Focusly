import { PENDING_FOCUS_REQUEST_STORAGE_KEY } from '@/lib/storageKeys';
import { FocusRequest, FocusSessionType } from '@/types/focus';

interface FocusRequestInput {
  type?: FocusSessionType;
  duration?: number;
  goal?: string;
  bookmarkId?: string;
  bookmarkTitle?: string;
  sourceUrl?: string;
  sourceDomain?: string;
  autoStart?: boolean;
}

const DEFAULT_FOCUS_DURATION = 25 * 60 * 1000;

export const normalizeFocusDuration = (duration?: number): number => {
  if (!duration || Number.isNaN(duration)) {
    return DEFAULT_FOCUS_DURATION;
  }

  return duration < 1000 ? duration * 60 * 1000 : duration;
};

export const createFocusRequest = (input: FocusRequestInput = {}): FocusRequest => ({
  id: Date.now().toString(),
  type: input.type || 'focus',
  duration: normalizeFocusDuration(input.duration),
  goal: input.goal,
  bookmarkId: input.bookmarkId,
  bookmarkTitle: input.bookmarkTitle,
  sourceUrl: input.sourceUrl,
  sourceDomain: input.sourceDomain,
  createdAt: new Date().toISOString(),
  autoStart: input.autoStart ?? true,
});

export const queueFocusRequest = async (input: FocusRequestInput = {}): Promise<FocusRequest> => {
  const request = createFocusRequest(input);
  await chrome.storage.local.set({ [PENDING_FOCUS_REQUEST_STORAGE_KEY]: request });
  return request;
};

export const getPendingFocusRequest = async (): Promise<FocusRequest | null> => {
  const result = await chrome.storage.local.get([PENDING_FOCUS_REQUEST_STORAGE_KEY]);
  return result[PENDING_FOCUS_REQUEST_STORAGE_KEY] || null;
};

export const clearPendingFocusRequest = async (): Promise<void> => {
  await chrome.storage.local.remove([PENDING_FOCUS_REQUEST_STORAGE_KEY]);
};
