import { DAILY_STATS_STORAGE_KEY } from '@/lib/storageKeys';

export interface DailyStats {
  bookmarksToday: number;
  focusMinutes: number;
  tasksCompleted: number;
}

export const defaultDailyStats: DailyStats = {
  bookmarksToday: 0,
  focusMinutes: 0,
  tasksCompleted: 0,
};

export const getDailyStats = async (): Promise<DailyStats> => {
  const result = await chrome.storage.local.get([DAILY_STATS_STORAGE_KEY]);
  return {
    ...defaultDailyStats,
    ...(result[DAILY_STATS_STORAGE_KEY] || {}),
  };
};

export const saveDailyStats = async (stats: DailyStats): Promise<void> => {
  await chrome.storage.local.set({ [DAILY_STATS_STORAGE_KEY]: stats });
};

export const incrementDailyStats = async (updates: Partial<DailyStats>): Promise<DailyStats> => {
  const current = await getDailyStats();
  const next = {
    bookmarksToday: current.bookmarksToday + (updates.bookmarksToday || 0),
    focusMinutes: current.focusMinutes + (updates.focusMinutes || 0),
    tasksCompleted: current.tasksCompleted + (updates.tasksCompleted || 0),
  };

  await saveDailyStats(next);
  return next;
};
