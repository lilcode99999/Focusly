import {
  BOOKMARKS_STORAGE_KEY,
  CURRENT_FOCUS_SESSION_STORAGE_KEY,
  DAILY_STATS_STORAGE_KEY,
  DAILY_TASKS_STORAGE_KEY,
  FOCUS_SESSIONS_STORAGE_KEY,
  LEGACY_SETTINGS_STORAGE_KEY,
  SETTINGS_STORAGE_KEY,
} from '@/lib/storageKeys';
import { queueFocusRequest } from '@/services/focusRequests';
import { saveBookmark } from '@/services/localBookmarks';
import { defaultDailyStats } from '@/services/localStats';
import { defaultSettings } from '@/types/settings';

// Background script for Smart Bookmarks extension

chrome.runtime.onInstalled.addListener(() => {
  console.log('Smart Bookmarks extension installed');

  // Initialize storage with default values
  chrome.storage.local.get([
    BOOKMARKS_STORAGE_KEY,
    DAILY_TASKS_STORAGE_KEY,
    FOCUS_SESSIONS_STORAGE_KEY,
    DAILY_STATS_STORAGE_KEY,
    SETTINGS_STORAGE_KEY,
  ], (result) => {
    if (!result[BOOKMARKS_STORAGE_KEY]) {
      chrome.storage.local.set({ [BOOKMARKS_STORAGE_KEY]: [] });
    }
    if (!result[DAILY_TASKS_STORAGE_KEY]) {
      chrome.storage.local.set({ [DAILY_TASKS_STORAGE_KEY]: [] });
    }
    if (!result[FOCUS_SESSIONS_STORAGE_KEY]) {
      chrome.storage.local.set({ [FOCUS_SESSIONS_STORAGE_KEY]: [] });
    }
    if (!result[DAILY_STATS_STORAGE_KEY]) {
      chrome.storage.local.set({ [DAILY_STATS_STORAGE_KEY]: defaultDailyStats });
    }
    if (!result[SETTINGS_STORAGE_KEY]) {
      chrome.storage.local.set({ [SETTINGS_STORAGE_KEY]: defaultSettings });
    }
  });
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'SAVE_BOOKMARK':
      handleSaveBookmark(message.data, sendResponse);
      return true;

    case 'START_FOCUS':
      handleStartFocusSession(message);
      break;

    case 'START_FOCUS_SESSION':
      handleStartFocusSession(message.data || message);
      break;

    case 'OPEN_SEARCH':
      handleOpenSearch();
      break;

    case 'OPEN_UPGRADE_MODAL':
      handleOpenUpgradeModal();
      break;

    case 'AUTH_STATE_CHANGED':
      handleAuthStateChanged(message);
      break;

    case 'CHECK_BLOCKED_URL':
      handleCheckBlockedUrl(message.url, sendResponse);
      return true; // Keep message channel open for async response

    case 'RECORD_TIME_ON_PAGE':
      handleRecordTimeOnPage(message.data);
      break;
  }

  return true;
});

async function handleSaveBookmark(
  data: {
    url: string;
    title: string;
    description?: string;
    tags?: string[];
    note?: string;
    whySaved?: string;
    mood?: string;
    energy?: 'low' | 'medium' | 'high';
    nextAction?: string;
    sourceTabTitle?: string;
  },
  sendResponse?: (response: any) => void
) {
  try {
    const result = await saveBookmark(data);

    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icon-128.png'),
      title: result.created ? 'Bookmark saved' : 'Bookmark updated',
      message: `"${result.bookmark.title}" is ready when you come back to it.`,
    });

    sendResponse?.({ ok: true, ...result });
  } catch (error) {
    console.error('Failed to save bookmark:', error);
    sendResponse?.({ ok: false, error: 'Bookmark could not be saved' });
  }
}

async function handleStartFocusSession(data: any = {}) {
  const request = await queueFocusRequest({
    duration: data.duration,
    goal: data.goal,
    bookmarkId: data.bookmarkId,
    bookmarkTitle: data.bookmarkTitle,
    sourceUrl: data.sourceUrl,
    sourceDomain: data.sourceDomain,
    type: data.type,
    autoStart: data.autoStart,
  });

  chrome.runtime.sendMessage({ type: 'SWITCH_TAB', tab: 'focus', focusRequest: request });
}

function handleOpenSearch() {
  chrome.runtime.sendMessage({ type: 'SWITCH_TAB', tab: 'library', focusSearch: true });
}

function handleOpenUpgradeModal() {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: chrome.runtime.getURL('icon-128.png'),
    title: 'Local-first MVP',
    message: 'Billing is parked for now while context recovery gets useful.',
  });
}

function handleAuthStateChanged(message: any) {
  // Broadcast auth state change to all tabs
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, message);
      }
    });
  });
}

// Reset daily stats at midnight
function scheduleDailyReset() {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const msUntilMidnight = tomorrow.getTime() - now.getTime();

  setTimeout(() => {
    chrome.storage.local.set({
      [DAILY_STATS_STORAGE_KEY]: defaultDailyStats,
      [DAILY_TASKS_STORAGE_KEY]: [],
    });

    // Schedule next reset
    scheduleDailyReset();
  }, msUntilMidnight);
}

scheduleDailyReset();

// Website blocking functionality
async function handleCheckBlockedUrl(url: string, sendResponse: (response: any) => void) {
  try {
    const settings = await getSettings();
    const isBlocked = await isUrlBlocked(url, settings);
    sendResponse({ blocked: isBlocked });
  } catch (error) {
    console.error('Error checking blocked URL:', error);
    sendResponse({ blocked: false });
  }
}

async function handleRecordTimeOnPage(data: { domain: string; timeSpent: number; timestamp: string }) {
  try {
    const { timeTracking } = await chrome.storage.local.get(['timeTracking']);
    const tracking = timeTracking || {};

    if (!tracking[data.domain]) {
      tracking[data.domain] = { totalTime: 0, sessions: [] };
    }

    tracking[data.domain].totalTime += data.timeSpent;
    tracking[data.domain].sessions.push({
      timeSpent: data.timeSpent,
      timestamp: data.timestamp,
    });

    // Keep only last 30 sessions per domain to avoid storage bloat
    if (tracking[data.domain].sessions.length > 30) {
      tracking[data.domain].sessions = tracking[data.domain].sessions.slice(-30);
    }

    await chrome.storage.local.set({ timeTracking: tracking });
  } catch (error) {
    console.error('Error recording time on page:', error);
  }
}

async function getSettings() {
  const result = await chrome.storage.local.get([SETTINGS_STORAGE_KEY, LEGACY_SETTINGS_STORAGE_KEY]);
  return result[SETTINGS_STORAGE_KEY] || result[LEGACY_SETTINGS_STORAGE_KEY] || getDefaultSettings();
}

function getDefaultSettings() {
  return defaultSettings;
}

async function isUrlBlocked(url: string, settings: any): Promise<boolean> {
  if (!settings.blocking.enabled) {
    return false;
  }

  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.toLowerCase();

    // Check custom websites
    const isCustomBlocked = settings.blocking.websites.some((blockedSite: string) => {
      const normalizedSite = blockedSite.toLowerCase().replace(/^www\./, '');
      const normalizedDomain = domain.replace(/^www\./, '');
      return normalizedDomain === normalizedSite || normalizedDomain.endsWith('.' + normalizedSite);
    });

    if (isCustomBlocked) {
      return true;
    }

    // Check category-based blocking
    const categoryBlocked = await isCategoryBlocked(domain, settings.blocking.categories);
    if (categoryBlocked) {
      return true;
    }

    // Check schedule-based blocking
    const scheduleBlocked = isScheduleBlocked(settings.blocking.schedules);
    if (scheduleBlocked) {
      return true;
    }

    // Check focus session blocking
    const focusBlocked = await isFocusBlocked(settings.blocking);
    if (focusBlocked) {
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking if URL is blocked:', error);
    return false;
  }
}

async function isCategoryBlocked(domain: string, enabledCategories: string[]): Promise<boolean> {
  const categoryMap: { [key: string]: string[] } = {
    'social-media': ['facebook.com', 'twitter.com', 'instagram.com', 'tiktok.com', 'linkedin.com'],
    'entertainment': ['youtube.com', 'netflix.com', 'twitch.tv', 'hulu.com', 'disney.com'],
    'news': ['reddit.com', 'cnn.com', 'bbc.com', 'nytimes.com', 'washingtonpost.com'],
    'shopping': ['amazon.com', 'ebay.com', 'etsy.com', 'walmart.com', 'target.com'],
    'gaming': ['steam.com', 'twitch.tv', 'ign.com', 'gamespot.com', 'polygon.com'],
  };

  for (const category of enabledCategories) {
    const sites = categoryMap[category] || [];
    const isBlocked = sites.some(site => {
      const normalizedSite = site.toLowerCase().replace(/^www\./, '');
      const normalizedDomain = domain.replace(/^www\./, '');
      return normalizedDomain === normalizedSite || normalizedDomain.endsWith('.' + normalizedSite);
    });

    if (isBlocked) {
      return true;
    }
  }

  return false;
}

function isScheduleBlocked(schedules: any[]): boolean {
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const currentTime = now.getHours() * 60 + now.getMinutes(); // Minutes since midnight

  return schedules.some(schedule => {
    if (!schedule.enabled) {
      return false;
    }

    // Check if current day is in the schedule
    const isDayEnabled = schedule.days.includes(currentDay);
    if (!isDayEnabled) {
      return false;
    }

    // Parse time strings (HH:MM format)
    const [startHour, startMin] = schedule.startTime.split(':').map(Number);
    const [endHour, endMin] = schedule.endTime.split(':').map(Number);

    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    // Check if current time is within the schedule
    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Handle overnight schedules (e.g., 23:00 to 01:00)
      return currentTime >= startTime || currentTime <= endTime;
    }
  });
}

async function isFocusBlocked(blockingSettings: any): Promise<boolean> {
  const result = await chrome.storage.local.get([CURRENT_FOCUS_SESSION_STORAGE_KEY]);
  const focusSession = result[CURRENT_FOCUS_SESSION_STORAGE_KEY];

  if (!focusSession || focusSession.completed || focusSession.endTime) {
    return false;
  }

  // Block during focus sessions
  if (blockingSettings.blockDuringFocus && focusSession.type === 'focus') {
    return true;
  }

  // Block during breaks if enabled
  if (blockingSettings.blockDuringBreaks && focusSession.type === 'break') {
    return true;
  }

  return false;
}

// Monitor tab updates to check for blocked URLs
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' && tab.url) {
    try {
      // Skip blocking for extension pages
      if (tab.url.startsWith('chrome-extension://')) {
        return;
      }

      // Check for active breakthrough session
      const { breakthroughSession } = await chrome.storage.local.get(['breakthroughSession']);
      if (breakthroughSession && breakthroughSession.expiry > Date.now()) {
        const breakthroughUrl = new URL(breakthroughSession.url);
        const currentUrl = new URL(tab.url);

        // Allow access if domains match
        if (breakthroughUrl.hostname === currentUrl.hostname) {
          return;
        }
      }

      const settings = await getSettings();
      const isBlocked = await isUrlBlocked(tab.url, settings);

      if (isBlocked) {
        // Redirect to a blocked page
        const blockedPageUrl = chrome.runtime.getURL('blocked.html') + '?url=' + encodeURIComponent(tab.url);
        chrome.tabs.update(tabId, { url: blockedPageUrl });
      }
    } catch (error) {
      console.error('Error checking blocked URL in tab update:', error);
    }
  }
});

// Clean up expired breakthrough sessions periodically
setInterval(async () => {
  try {
    const { breakthroughSession } = await chrome.storage.local.get(['breakthroughSession']);
    if (breakthroughSession && breakthroughSession.expiry <= Date.now()) {
      await chrome.storage.local.remove(['breakthroughSession']);
    }
  } catch (error) {
    console.error('Error cleaning up breakthrough session:', error);
  }
}, 60000); // Check every minute
