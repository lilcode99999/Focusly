import React, { useCallback, useEffect, useState } from 'react';
import Analytics from './Analytics';
import { BOOKMARKS_STORAGE_KEY, FOCUS_SESSIONS_STORAGE_KEY } from '@/lib/storageKeys';
import { SmartBookmark } from '@/types/bookmark';
import { FocusSession } from '@/types/focus';
import './InsightsTab.css';

interface InsightsData {
  dailyFocusMinutes: number[];
  weeklyBookmarks: number;
  productivityScore: number;
  topTags: { tag: string; count: number }[];
  focusPatterns: {
    morningMinutes: number;
    afternoonMinutes: number;
    eveningMinutes: number;
  };
}

const emptyInsights: InsightsData = {
  dailyFocusMinutes: [0, 0, 0, 0, 0, 0, 0],
  weeklyBookmarks: 0,
  productivityScore: 0,
  topTags: [],
  focusPatterns: {
    morningMinutes: 0,
    afternoonMinutes: 0,
    eveningMinutes: 0,
  },
};

const getStartOfDay = (date: Date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
};

const getSessionMinutes = (session: FocusSession) => {
  if (!session.completed || session.type !== 'focus') {
    return 0;
  }

  return Math.max(1, Math.round(session.duration / 60000));
};

const buildLocalInsights = (
  bookmarks: SmartBookmark[],
  sessions: FocusSession[]
): InsightsData => {
  const today = getStartOfDay(new Date());
  const windowStart = new Date(today);
  windowStart.setDate(today.getDate() - 6);
  const dailyFocusMinutes = [...emptyInsights.dailyFocusMinutes];
  const focusPatterns = { ...emptyInsights.focusPatterns };

  sessions.forEach((session) => {
    const startedAt = new Date(session.startTime);
    const minutes = getSessionMinutes(session);

    if (!minutes || Number.isNaN(startedAt.getTime())) {
      return;
    }

    if (startedAt >= windowStart) {
      const dayIndex = Math.floor(
        (getStartOfDay(startedAt).getTime() - windowStart.getTime()) / 86400000
      );

      if (dayIndex >= 0 && dayIndex < dailyFocusMinutes.length) {
        dailyFocusMinutes[dayIndex] += minutes;
      }
    }

    const hour = startedAt.getHours();
    if (hour < 12) {
      focusPatterns.morningMinutes += minutes;
    } else if (hour < 17) {
      focusPatterns.afternoonMinutes += minutes;
    } else {
      focusPatterns.eveningMinutes += minutes;
    }
  });

  const weeklyBookmarks = bookmarks.filter((bookmark) => {
    const createdAt = new Date(bookmark.createdAt);
    return !Number.isNaN(createdAt.getTime()) && createdAt >= windowStart;
  }).length;

  const tagCounts = new Map<string, number>();
  bookmarks.forEach((bookmark) => {
    bookmark.tags.forEach((tag) => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });

  const topTags = Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));

  const weeklyFocus = dailyFocusMinutes.reduce((sum, minutes) => sum + minutes, 0);
  const focusScore = Math.min(70, Math.round((Math.min(weeklyFocus, 150) / 150) * 70));
  const captureScore = Math.min(30, Math.round((Math.min(weeklyBookmarks, 6) / 6) * 30));

  return {
    dailyFocusMinutes,
    weeklyBookmarks,
    productivityScore: focusScore + captureScore,
    topTags,
    focusPatterns,
  };
};

const InsightsTab: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<InsightsData>(emptyInsights);

  const loadAnalytics = useCallback(async () => {
    const result = await chrome.storage.local.get([
      BOOKMARKS_STORAGE_KEY,
      FOCUS_SESSIONS_STORAGE_KEY,
    ]);
    const bookmarks = Array.isArray(result[BOOKMARKS_STORAGE_KEY])
      ? result[BOOKMARKS_STORAGE_KEY]
      : [];
    const sessions = Array.isArray(result[FOCUS_SESSIONS_STORAGE_KEY])
      ? result[FOCUS_SESSIONS_STORAGE_KEY]
      : [];

    setAnalyticsData(buildLocalInsights(bookmarks, sessions));
  }, []);

  useEffect(() => {
    loadAnalytics();

    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes[BOOKMARKS_STORAGE_KEY] || changes[FOCUS_SESSIONS_STORAGE_KEY]) {
        loadAnalytics();
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, [loadAnalytics]);

  return (
    <div className="insights-tab">
      <div className="insights-header">
        <h2>Your Insights</h2>
        <p className="insights-subtitle">
          Local patterns from saved context and completed focus sessions.
        </p>
      </div>

      <Analytics data={analyticsData} />
    </div>
  );
};

export default InsightsTab;
