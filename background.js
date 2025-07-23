// Import configuration from config.local.js
// IMPORTANT: Create config.local.js with your actual keys - see config.template.js
let SUPABASE_CONFIG = {
  url: null,
  anonKey: null
};

// Try to load config from config.local.js
try {
  // In a Chrome extension, we need to handle this differently
  // Config should be loaded via a separate script tag in the manifest
  if (typeof SUPABASE_URL !== 'undefined' && typeof SUPABASE_ANON_KEY !== 'undefined') {
    SUPABASE_CONFIG.url = SUPABASE_URL;
    SUPABASE_CONFIG.anonKey = SUPABASE_ANON_KEY;
  }
} catch (e) {
  console.warn('Config not found. Please create config.local.js from config.template.js');
}

class SmartBookmarksBackground {
  constructor() {
    this.mcpServerUrl = 'http://localhost:3000';
    this.bookmarkCache = new Map();
    this.timerInterval = null;
    this.isConfigured = false;
    this.timerState = {
      isRunning: false,
      startTime: null,
      duration: 25 * 60 * 1000, // 25 minutes in milliseconds
      timeRemaining: 25 * 60 * 1000,
      pausedTime: null,
      mode: 'focus', // 'focus' or 'break'
      cycleCount: 0 // Track completed focus-break cycles
    };
    this.sessionId = Date.now();
    this.checkConfiguration();
    this.init();
  }
  
  checkConfiguration() {
    if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey) {
      console.error('⚠️ Focusly: Missing configuration!');
      console.error('Please create config.local.js from config.template.js with your Supabase credentials.');
      this.isConfigured = false;
      // Show notification to user
      chrome.notifications.create('config-missing', {
        type: 'basic',
        iconUrl: 'icon-128.png',
        title: 'Focusly Configuration Required',
        message: 'Please set up your Supabase credentials. See console for details.',
        priority: 2
      });
    } else {
      this.isConfigured = true;
      console.log('✅ Focusly: Configuration loaded successfully');
    }
  }
  
  init() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true;
    });
    
    chrome.bookmarks.onCreated.addListener((id, bookmark) => {
      this.onBookmarkCreated(id, bookmark);
    });
    
    chrome.bookmarks.onRemoved.addListener((id, removeInfo) => {
      this.onBookmarkRemoved(id, removeInfo);
    });
    
    chrome.bookmarks.onChanged.addListener((id, changeInfo) => {
      this.onBookmarkChanged(id, changeInfo);
    });
    
    // Track tab updates to detect bookmark visits
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url) {
        this.trackPageVisit(tab.url);
      }
    });
    
    this.initializeBookmarkCache();
    this.restoreTimerState();
  }
  
  async handleMessage(request, sender, sendResponse) {
    try {
      switch (request.action) {
        case 'searchBookmarks':
          const results = await this.searchBookmarks(request.query, request.type);
          sendResponse({ bookmarks: results });
          break;
        
        case 'getRecentBookmarks':
          const recent = await this.getRecentBookmarks(request.limit || 10);
          sendResponse({ bookmarks: recent });
          break;
        
        case 'indexBookmark':
          await this.indexBookmark(request.bookmark);
          sendResponse({ success: true });
          break;
        
        case 'getBookmarkContent':
          const content = await this.getBookmarkContent(request.url);
          sendResponse({ content });
          break;
        
        case 'trackBookmarkClick':
          await this.trackBookmarkClick(request);
          sendResponse({ success: true });
          break;
        
        case 'trackTimerEvent':
          await this.trackTimerEvent(request);
          sendResponse({ success: true });
          break;
        
        case 'recordTimeSession':
          await this.recordTimeSession(request.session);
          sendResponse({ success: true });
          break;
        
        case 'getTimeSpentToday':
          const timeSpent = await this.getTimeSpentToday(request.domain);
          sendResponse({ timeSpent });
          break;
        
        case 'getFocusMode':
          const focusMode = await this.getFocusMode();
          sendResponse({ isFocusMode: focusMode });
          break;
        
        case 'grantTemporaryAccess':
          await this.grantTemporaryAccess(request.domain, request.duration);
          sendResponse({ success: true });
          break;
        
        case 'clearRecentBookmarks':
          await this.clearRecentBookmarks();
          sendResponse({ success: true });
          break;
        
        case 'settingChanged':
          await this.handleSettingChange(request.setting, request.value);
          sendResponse({ success: true });
          break;
        
        case 'getTimerState':
          sendResponse({ timerState: this.timerState });
          break;
        
        case 'startTimer':
          if (request.mode === 'break') {
            await this.startBreakTimer(request.duration);
          } else {
            await this.startFocusTimer(request.duration);
          }
          sendResponse({ success: true });
          break;
        
        case 'pauseTimer':
          await this.pauseTimer();
          sendResponse({ success: true });
          break;
        
        case 'resetTimer':
          await this.resetTimer(request.duration);
          sendResponse({ success: true });
          break;
        
        case 'startBreakTimer':
          await this.startBreakTimer(request.duration);
          sendResponse({ success: true });
          break;
        
        case 'startFocusTimer':
          await this.startFocusTimer(request.duration);
          sendResponse({ success: true });
          break;
        
        case 'updateTimerDuration':
          await this.updateTimerDuration(request.duration, request.elapsed);
          sendResponse({ success: true });
          break;
        
        case 'getFocusAnalytics':
          const analytics = await this.getFocusAnalytics();
          sendResponse({ analytics });
          break;
        
        case 'getNotifications':
          const notifications = await this.getNotifications();
          sendResponse({ notifications });
          break;
        
        case 'markNotificationRead':
          await this.markNotificationRead(request.notificationId);
          sendResponse({ success: true });
          break;
          
        case 'updateDailyProgress':
          // For testing purposes
          if (request.minutes) {
            await this.updateDailyProgress(request.minutes);
            sendResponse({ success: true });
          }
          break;
        
        case 'clearNotification':
          await this.clearNotification(request.notificationId);
          sendResponse({ success: true });
          break;
        
        case 'clearAllNotifications':
          await this.clearAllNotifications();
          sendResponse({ success: true });
          break;
        
        case 'handleNotificationAction':
          await this.handleNotificationAction(request.notification);
          sendResponse({ success: true });
          break;
        
        case 'trackEvent':
          await this.trackAnalyticsEvent(request.event);
          sendResponse({ success: true });
          break;
        
        case 'proActivated':
          await this.handleProActivation(request);
          sendResponse({ success: true });
          break;
        
        case 'oauthCallback':
          // Handle OAuth callback from callback page
          const authResult = await this.handleOAuthCallback(request.accessToken, request.refreshToken);
          sendResponse(authResult);
          break;
        
        case 'checkSubscriptionUpdate':
          // Refresh subscription status after payment
          await this.syncSubscriptionStatus();
          sendResponse({ success: true });
          break;
        
        case 'breakNotificationAction':
          await this.handleBreakNotificationAction(request.breakAction, request.duration);
          sendResponse({ success: true });
          break;
        
        case 'getSharedNote':
          const sharedNote = await this.getSharedNote(request.noteId);
          sendResponse({ note: sharedNote });
          break;
        
        case 'createCheckoutSession':
          const checkoutResult = await this.createCheckoutSession(request);
          sendResponse(checkoutResult);
          break;
        
        default:
          sendResponse({ error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Background script error:', error);
      sendResponse({ error: error.message });
    }
  }
  
  async searchBookmarks(query, type) {
    if (type === 'semantic') {
      return await this.semanticSearch(query);
    } else {
      return await this.keywordSearch(query);
    }
  }
  
  async semanticSearch(query) {
    try {
      const response = await fetch(`${this.mcpServerUrl}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, type: 'semantic' })
      });
      
      if (!response.ok) {
        throw new Error('MCP server unavailable');
      }
      
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.warn('Semantic search failed, falling back to keyword search:', error);
      return await this.keywordSearch(query);
    }
  }
  
  async keywordSearch(query) {
    return new Promise((resolve) => {
      chrome.bookmarks.search(query, (results) => {
        const bookmarks = results
          .filter(bookmark => bookmark.url)
          .map(bookmark => ({
            id: bookmark.id,
            title: bookmark.title,
            url: bookmark.url,
            dateAdded: bookmark.dateAdded
          }))
          .sort((a, b) => b.dateAdded - a.dateAdded);
        
        resolve(bookmarks);
      });
    });
  }
  
  async initializeBookmarkCache() {
    try {
      const bookmarks = await this.getAllBookmarks();
      for (const bookmark of bookmarks) {
        if (bookmark.url) {
          this.bookmarkCache.set(bookmark.id, bookmark);
          await this.indexBookmark(bookmark);
        }
      }
      console.log(`Initialized ${bookmarks.length} bookmarks`);
    } catch (error) {
      console.error('Failed to initialize bookmark cache:', error);
    }
  }
  
  async getAllBookmarks() {
    return new Promise((resolve) => {
      chrome.bookmarks.getTree((bookmarkTreeNodes) => {
        const bookmarks = [];
        
        function collectBookmarks(nodes) {
          for (const node of nodes) {
            if (node.url) {
              bookmarks.push(node);
            }
            if (node.children) {
              collectBookmarks(node.children);
            }
          }
        }
        
        collectBookmarks(bookmarkTreeNodes);
        resolve(bookmarks);
      });
    });
  }
  
  async indexBookmark(bookmark) {
    try {
      const response = await fetch(`${this.mcpServerUrl}/index`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: bookmark.id,
          title: bookmark.title,
          url: bookmark.url,
          dateAdded: bookmark.dateAdded
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to index bookmark');
      }
    } catch (error) {
      console.warn('Failed to index bookmark:', error);
    }
  }
  
  async getBookmarkContent(url) {
    try {
      const response = await fetch(`${this.mcpServerUrl}/content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url })
      });
      
      if (!response.ok) {
        throw new Error('Failed to get content');
      }
      
      const data = await response.json();
      return data.content;
    } catch (error) {
      console.warn('Failed to get bookmark content:', error);
      return null;
    }
  }
  
  async onBookmarkCreated(id, bookmark) {
    if (bookmark.url) {
      this.bookmarkCache.set(id, bookmark);
      await this.indexBookmark(bookmark);
    }
  }
  
  async onBookmarkRemoved(id, removeInfo) {
    this.bookmarkCache.delete(id);
    
    try {
      await fetch(`${this.mcpServerUrl}/remove`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id })
      });
    } catch (error) {
      console.warn('Failed to remove bookmark from index:', error);
    }
  }
  
  async onBookmarkChanged(id, changeInfo) {
    const bookmark = this.bookmarkCache.get(id);
    if (bookmark) {
      const updatedBookmark = { ...bookmark, ...changeInfo };
      this.bookmarkCache.set(id, updatedBookmark);
      await this.indexBookmark(updatedBookmark);
    }
  }

  async trackPageVisit(url) {
    try {
      // Check if this URL matches any bookmarks
      const bookmark = await this.findBookmarkByUrl(url);
      if (bookmark) {
        await this.addToRecentBookmarks(bookmark);
      }
    } catch (error) {
      console.warn('Failed to track page visit:', error);
    }
  }

  async findBookmarkByUrl(url) {
    // Search through cached bookmarks for matching URL
    for (const [id, bookmark] of this.bookmarkCache) {
      if (bookmark.url === url) {
        return {
          id: bookmark.id,
          title: bookmark.title,
          url: bookmark.url,
          dateAdded: bookmark.dateAdded,
          lastVisited: Date.now()
        };
      }
    }
    return null;
  }

  async addToRecentBookmarks(bookmark) {
    try {
      const stored = await this.safeStorageGet(['recentBookmarks'], { recentBookmarks: [] });
      let recentBookmarks = stored.recentBookmarks;
      
      // Remove existing entry if it exists (to avoid duplicates)
      recentBookmarks = recentBookmarks.filter(recent => recent.url !== bookmark.url);
      
      // Add to the beginning of the list
      recentBookmarks.unshift({
        ...bookmark,
        lastVisited: Date.now()
      });
      
      // Keep only the most recent 15 bookmarks
      recentBookmarks = recentBookmarks.slice(0, 15);
      
      const success = await this.safeStorageSet({ recentBookmarks });
      if (success) {
        console.log('Added bookmark to recents:', bookmark.title);
      }
    } catch (error) {
      console.warn('Failed to add to recent bookmarks:', error);
    }
  }
  
  async getRecentBookmarks(limit = 10) {
    try {
      // Get our tracked recent bookmarks list
      const stored = await this.safeStorageGet(['recentBookmarks'], { recentBookmarks: [] });
      let recentBookmarks = stored.recentBookmarks;
      
      // If we have tracked bookmarks, return them
      if (recentBookmarks.length > 0) {
        return recentBookmarks
          .sort((a, b) => (b.lastVisited || b.dateAdded) - (a.lastVisited || a.dateAdded))
          .slice(0, limit);
      }
      
      // If no tracked bookmarks, show empty state with instructions
      console.log('No recent bookmarks found - user needs to visit bookmarked pages');
      return [];
    } catch (error) {
      console.warn('Failed to get recent bookmarks:', error);
      return [];
    }
  }
  
  async trackBookmarkClick(data) {
    try {
      // Find the bookmark being clicked
      const bookmark = await this.findBookmarkByUrl(data.url);
      if (bookmark) {
        // Add to recent bookmarks since it was clicked
        await this.addToRecentBookmarks(bookmark);
      }
      
      const analytics = {
        type: 'bookmark_click',
        url: data.url,
        timestamp: data.timestamp,
        timerActive: data.timerActive
      };
      
      // Store in local storage for analytics
      const stored = await chrome.storage.local.get(['analytics']) || { analytics: [] };
      stored.analytics = stored.analytics || [];
      stored.analytics.push(analytics);
      
      // Keep only last 1000 events
      if (stored.analytics.length > 1000) {
        stored.analytics = stored.analytics.slice(-1000);
      }
      
      await chrome.storage.local.set({ analytics: stored.analytics });
      
      // Send to MCP server if available
      await this.sendAnalyticsToMCP(analytics);
    } catch (error) {
      console.warn('Failed to track bookmark click:', error);
    }
  }
  
  async trackTimerEvent(data) {
    try {
      const analytics = {
        type: 'timer_event',
        event: data.event,
        duration: data.duration,
        timestamp: data.timestamp
      };
      
      // Store in local storage
      const stored = await chrome.storage.local.get(['analytics']) || { analytics: [] };
      stored.analytics = stored.analytics || [];
      stored.analytics.push(analytics);
      
      // Keep only last 1000 events
      if (stored.analytics.length > 1000) {
        stored.analytics = stored.analytics.slice(-1000);
      }
      
      await chrome.storage.local.set({ analytics: stored.analytics });
      
      // Send to MCP server if available
      await this.sendAnalyticsToMCP(analytics);
    } catch (error) {
      console.warn('Failed to track timer event:', error);
    }
  }
  
  async sendAnalyticsToMCP(data) {
    try {
      await fetch(`${this.mcpServerUrl}/analytics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
    } catch (error) {
      // MCP server might be offline, analytics are stored locally
      console.debug('MCP server unavailable for analytics:', error);
    }
  }
  
  async recordTimeSession(session) {
    try {
      const stored = await chrome.storage.local.get(['timeSessions']) || { timeSessions: [] };
      stored.timeSessions = stored.timeSessions || [];
      stored.timeSessions.push(session);
      
      // Keep only last 1000 sessions
      if (stored.timeSessions.length > 1000) {
        stored.timeSessions = stored.timeSessions.slice(-1000);
      }
      
      await chrome.storage.local.set({ timeSessions: stored.timeSessions });
      
      // Update daily statistics
      await this.updateDailyStats(session);
    } catch (error) {
      console.warn('Failed to record time session:', error);
    }
  }
  
  async updateDailyStats(session) {
    try {
      const today = new Date().toDateString();
      const stored = await chrome.storage.local.get(['dailyStats']) || { dailyStats: {} };
      stored.dailyStats = stored.dailyStats || {};
      
      if (!stored.dailyStats[today]) {
        stored.dailyStats[today] = {};
      }
      
      if (!stored.dailyStats[today][session.domain]) {
        stored.dailyStats[today][session.domain] = {
          activeTime: 0,
          visits: 0,
          lastVisit: session.timestamp
        };
      }
      
      stored.dailyStats[today][session.domain].activeTime += session.activeTime;
      stored.dailyStats[today][session.domain].visits += 1;
      stored.dailyStats[today][session.domain].lastVisit = session.timestamp;
      
      await chrome.storage.local.set({ dailyStats: stored.dailyStats });
    } catch (error) {
      console.warn('Failed to update daily stats:', error);
    }
  }
  
  async getTimeSpentToday(domain) {
    try {
      const today = new Date().toDateString();
      const stored = await chrome.storage.local.get(['dailyStats']);
      
      if (stored.dailyStats && stored.dailyStats[today] && stored.dailyStats[today][domain]) {
        return stored.dailyStats[today][domain].activeTime;
      }
      
      return 0;
    } catch (error) {
      console.warn('Failed to get time spent today:', error);
      return 0;
    }
  }
  
  async getFocusMode() {
    try {
      const stored = await chrome.storage.local.get(['focusMode']);
      return stored.focusMode || false;
    } catch (error) {
      console.warn('Failed to get focus mode:', error);
      return false;
    }
  }
  
  async setFocusMode(enabled) {
    try {
      await chrome.storage.local.set({ focusMode: enabled });
      
      // Notify all tabs about focus mode change
      const tabs = await chrome.tabs.query({});
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          action: 'focusModeChanged',
          enabled: enabled
        }).catch(() => {}); // Ignore errors for tabs that can't receive messages
      });
    } catch (error) {
      console.warn('Failed to set focus mode:', error);
    }
  }
  
  async grantTemporaryAccess(domain, duration) {
    try {
      const stored = await chrome.storage.local.get(['temporaryAccess']) || { temporaryAccess: {} };
      stored.temporaryAccess = stored.temporaryAccess || {};
      
      stored.temporaryAccess[domain] = Date.now() + duration;
      
      await chrome.storage.local.set({ temporaryAccess: stored.temporaryAccess });
    } catch (error) {
      console.warn('Failed to grant temporary access:', error);
    }
  }
  

  async clearRecentBookmarks() {
    try {
      await chrome.storage.local.set({ recentBookmarks: [] });
      console.log('Recent bookmarks cleared successfully');
    } catch (error) {
      console.warn('Failed to clear recent bookmarks:', error);
      throw error; // Re-throw so popup can handle the error
    }
  }

  // Helper method for safe storage operations
  async safeStorageGet(keys, defaultValues = {}) {
    try {
      const result = await chrome.storage.local.get(keys);
      return { ...defaultValues, ...result };
    } catch (error) {
      console.warn('Storage get failed:', error);
      return defaultValues;
    }
  }

  async safeStorageSet(data) {
    try {
      await chrome.storage.local.set(data);
      return true;
    } catch (error) {
      console.warn('Storage set failed:', error);
      return false;
    }
  }
  
  async restoreTimerState() {
    try {
      const stored = await chrome.storage.local.get(['timerState']);
      if (stored.timerState) {
        this.timerState = { ...this.timerState, ...stored.timerState };
        
        // If timer was running, calculate elapsed time and continue
        if (this.timerState.isRunning && this.timerState.startTime) {
          const now = Date.now();
          const elapsed = now - this.timerState.startTime;
          this.timerState.timeRemaining = Math.max(0, this.timerState.duration - elapsed);
          
          if (this.timerState.timeRemaining > 0) {
            this.startBackgroundTimer();
          } else {
            // Timer completed while extension was closed
            await this.completeTimer();
          }
        }
      }
    } catch (error) {
      console.warn('Failed to restore timer state:', error);
    }
  }

  async saveTimerState() {
    try {
      await chrome.storage.local.set({ timerState: this.timerState });
    } catch (error) {
      console.warn('Failed to save timer state:', error);
    }
  }

  async startTimer(duration) {
    try {
      const durationMs = duration * 60 * 1000; // Convert minutes to milliseconds
      
      if (this.timerState.isRunning && this.timerState.pausedTime) {
        // Resume from pause
        this.timerState.startTime = Date.now() - (this.timerState.duration - this.timerState.timeRemaining);
        this.timerState.pausedTime = null;
      } else {
        // Start new timer
        this.timerState.duration = durationMs;
        this.timerState.timeRemaining = durationMs;
        this.timerState.startTime = Date.now();
      }
      
      this.timerState.isRunning = true;
      await this.saveTimerState();
      this.startBackgroundTimer();
      
      // Track timer start event
      await this.trackTimerEvent({
        event: 'start',
        duration: this.timerState.duration,
        timestamp: Date.now()
      });
    } catch (error) {
      console.warn('Failed to start timer:', error);
    }
  }

  async pauseTimer() {
    try {
      this.timerState.isRunning = false;
      this.timerState.pausedTime = Date.now();
      
      // Calculate remaining time
      if (this.timerState.startTime) {
        const elapsed = this.timerState.pausedTime - this.timerState.startTime;
        this.timerState.timeRemaining = Math.max(0, this.timerState.duration - elapsed);
        
        // Record incomplete session when paused (if significant time elapsed)
        const sessionDuration = elapsed / (60 * 1000); // Convert to minutes
        if (sessionDuration >= 1) { // Only record if at least 1 minute elapsed
          await this.recordFocusSession({
            duration: this.timerState.duration / (60 * 1000), // Original duration in minutes
            completed: false,
            startTime: this.timerState.startTime,
            endTime: this.timerState.pausedTime,
            actualDuration: sessionDuration
          });
          
          // Update daily progress with actual time spent
          await this.updateDailyProgress(sessionDuration);
        }
      }
      
      this.stopBackgroundTimer();
      await this.saveTimerState();
      
      // Track timer pause event
      await this.trackTimerEvent({
        event: 'pause',
        duration: this.timerState.duration - this.timerState.timeRemaining,
        timestamp: Date.now()
      });
    } catch (error) {
      console.warn('Failed to pause timer:', error);
    }
  }

  async resetTimer(duration) {
    try {
      const durationMs = duration * 60 * 1000;
      
      // Preserve the mode when resetting
      const currentMode = this.timerState.mode || 'focus';
      
      this.timerState = {
        isRunning: false,
        startTime: null,
        duration: durationMs,
        timeRemaining: durationMs,
        pausedTime: null,
        mode: currentMode,
        cycleCount: this.timerState.cycleCount || 0
      };
      
      this.stopBackgroundTimer();
      await this.saveTimerState();
      
      // Track timer reset event
      await this.trackTimerEvent({
        event: 'reset',
        duration: 0,
        timestamp: Date.now()
      });
    } catch (error) {
      console.warn('Failed to reset timer:', error);
    }
  }

  startBackgroundTimer() {
    this.stopBackgroundTimer(); // Clear any existing timer
    
    this.timerInterval = setInterval(async () => {
      if (!this.timerState.isRunning || !this.timerState.startTime) {
        this.stopBackgroundTimer();
        return;
      }
      
      const now = Date.now();
      const elapsed = now - this.timerState.startTime;
      this.timerState.timeRemaining = Math.max(0, this.timerState.duration - elapsed);
      
      // Save state periodically
      await this.saveTimerState();
      
      // Check if timer completed
      if (this.timerState.timeRemaining <= 0) {
        await this.completeTimer();
      }
    }, 1000); // Update every second
  }

  stopBackgroundTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  async updateTimerDuration(newDurationMinutes, elapsedMs) {
    try {
      const newDurationMs = newDurationMinutes * 60 * 1000;
      
      // Update timer state with new duration
      this.timerState.duration = newDurationMs;
      this.timerState.timeRemaining = Math.max(0, newDurationMs - elapsedMs);
      
      // If timer would be completed with new duration, complete it
      if (this.timerState.timeRemaining <= 0) {
        await this.completeTimer();
      } else {
        await this.saveTimerState();
      }
      
      console.log(`Timer duration updated to ${newDurationMinutes} minutes`);
    } catch (error) {
      console.warn('Failed to update timer duration:', error);
    }
  }

  async completeTimer() {
    try {
      const isBreakMode = this.timerState.mode === 'break';
      
      // Record completed session (only for focus sessions)
      if (!isBreakMode) {
        const sessionDuration = this.timerState.duration / (60 * 1000); // Convert to minutes
        await this.recordFocusSession({
          duration: sessionDuration,
          completed: true,
          startTime: this.timerState.startTime,
          endTime: Date.now()
        });
        
        // Update daily progress
        await this.updateDailyProgress(sessionDuration);
      }
      
      // Track completion
      await this.trackTimerEvent({
        event: 'complete',
        duration: this.timerState.duration,
        timestamp: Date.now(),
        mode: this.timerState.mode
      });
      
      // Increment cycle count after completing a break
      if (isBreakMode) {
        this.timerState.cycleCount++;
      }
      
      // Show notification overlay
      await this.showTimerCompleteNotification();
      
      // Stop the timer but preserve mode and cycle count
      this.timerState.isRunning = false;
      this.timerState.startTime = null;
      this.stopBackgroundTimer();
      await this.saveTimerState();
    } catch (error) {
      console.warn('Failed to complete timer:', error);
    }
  }

  async handleSettingChange(setting, value) {
    try {
      // Handle specific setting changes that need immediate action
      switch (setting) {
        case 'enableTimeTracking':
          // Notify all tabs about time tracking change
          const tabs = await chrome.tabs.query({});
          tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, {
              action: 'timeTrackingChanged',
              enabled: value
            }).catch(() => {});
          });
          break;
          
        case 'theme':
          // Theme changes are handled by individual components
          break;
      }
    } catch (error) {
      console.warn('Failed to handle setting change:', error);
    }
  }

  // Focus Analytics Methods
  async recordFocusSession(session) {
    try {
      const stored = await this.safeStorageGet(['focusAnalytics'], { 
        focusAnalytics: {
          sessions: [],
          weeklyStats: { totalFocusTime: 0, averageSession: 0, completionRate: 0 },
          preferences: { optimalDuration: 25, bestCompletionRate: 0 }
        }
      });
      
      const analytics = stored.focusAnalytics;
      
      // Add new session
      analytics.sessions.push({
        ...session,
        timestamp: Date.now(),
        id: Date.now() + Math.random()
      });
      
      // Keep only last 100 sessions for performance
      if (analytics.sessions.length > 100) {
        analytics.sessions = analytics.sessions.slice(-100);
      }
      
      // Update analytics
      await this.updateFocusAnalytics(analytics);
      await this.safeStorageSet({ focusAnalytics: analytics });
      
      console.log('Focus session recorded:', session);
    } catch (error) {
      console.warn('Failed to record focus session:', error);
    }
  }

  async updateFocusAnalytics(analytics) {
    const now = Date.now();
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
    
    // Get sessions from last week
    const recentSessions = analytics.sessions.filter(s => s.timestamp > oneWeekAgo);
    
    if (recentSessions.length === 0) {
      analytics.weeklyStats = { totalFocusTime: 0, averageSession: 0, completionRate: 0 };
      return;
    }
    
    // Calculate weekly stats
    const completedSessions = recentSessions.filter(s => s.completed);
    const totalFocusTime = completedSessions.reduce((sum, s) => sum + s.duration, 0);
    const averageSession = completedSessions.length > 0 ? totalFocusTime / completedSessions.length : 0;
    const completionRate = recentSessions.length > 0 ? (completedSessions.length / recentSessions.length) * 100 : 0;
    
    analytics.weeklyStats = {
      totalFocusTime: Math.round(totalFocusTime),
      averageSession: Math.round(averageSession),
      completionRate: Math.round(completionRate)
    };
    
    // Calculate optimal duration preferences
    await this.updateDurationPreferences(analytics);
  }

  async updateDurationPreferences(analytics) {
    // Group sessions by duration and calculate completion rates
    const durationStats = {};
    
    analytics.sessions.forEach(session => {
      const duration = session.duration;
      if (!durationStats[duration]) {
        durationStats[duration] = { total: 0, completed: 0 };
      }
      durationStats[duration].total++;
      if (session.completed) {
        durationStats[duration].completed++;
      }
    });
    
    // Find duration with best completion rate (minimum 3 sessions)
    let bestDuration = 25;
    let bestRate = 0;
    
    for (const [duration, stats] of Object.entries(durationStats)) {
      if (stats.total >= 3) {
        const rate = (stats.completed / stats.total) * 100;
        if (rate > bestRate) {
          bestRate = rate;
          bestDuration = parseInt(duration);
        }
      }
    }
    
    analytics.preferences = {
      optimalDuration: bestDuration,
      bestCompletionRate: Math.round(bestRate)
    };
  }

  async updateDailyProgress(sessionMinutes) {
    try {
      const stored = await this.safeStorageGet(['userData', 'lastActiveDate'], {
        userData: {
          todayFocusTime: 0,
          completedSessions: 0,
          dailyGoalType: 'time',
          dailyGoalMinutes: 120,
          dailyGoalSessions: 4,
          goalStreak: 0,
          lastGoalDate: null
        }
      });
      
      const userData = stored.userData;
      const today = new Date().toDateString();
      
      // Reset daily stats if it's a new day
      if (stored.lastActiveDate !== today) {
        userData.todayFocusTime = 0;
        userData.completedSessions = 0;
      }
      
      // Update daily progress
      userData.todayFocusTime += Math.round(sessionMinutes);
      userData.completedSessions += 1;
      
      // Save updated data
      await this.safeStorageSet({ 
        userData,
        lastActiveDate: today
      });
      
      console.log('Daily progress updated:', {
        todayFocusTime: userData.todayFocusTime,
        completedSessions: userData.completedSessions
      });
      
      // Update badge to show progress
      await this.updateBrowserBadge();
      
    } catch (error) {
      console.warn('Failed to update daily progress:', error);
    }
  }

  async getFocusAnalytics() {
    try {
      const stored = await this.safeStorageGet(['focusAnalytics'], { 
        focusAnalytics: {
          sessions: [],
          weeklyStats: { totalFocusTime: 0, averageSession: 0, completionRate: 0 },
          preferences: { optimalDuration: 25, bestCompletionRate: 0 }
        }
      });
      
      const analytics = stored.focusAnalytics;
      
      // Ensure analytics are up to date
      await this.updateFocusAnalytics(analytics);
      await this.safeStorageSet({ focusAnalytics: analytics });
      
      // Generate insights
      const insights = await this.generateInsights(analytics);
      
      return {
        ...analytics,
        insights,
        lastUpdated: Date.now()
      };
    } catch (error) {
      console.warn('Failed to get focus analytics:', error);
      return {
        sessions: [],
        weeklyStats: { totalFocusTime: 0, averageSession: 0, completionRate: 0 },
        preferences: { optimalDuration: 25, bestCompletionRate: 0 },
        insights: [],
        lastUpdated: Date.now()
      };
    }
  }

  async generateInsights(analytics) {
    const insights = [];
    const { weeklyStats, preferences, sessions } = analytics;
    
    // Completion rate insights
    if (weeklyStats.completionRate >= 85) {
      insights.push({
        type: 'success',
        title: 'Excellent Focus!',
        message: `Amazing ${weeklyStats.completionRate}% completion rate this week. You're in the zone!`,
        icon: '🎯'
      });
    } else if (weeklyStats.completionRate >= 60) {
      insights.push({
        type: 'good',
        title: 'Good Progress',
        message: `${weeklyStats.completionRate}% completion rate. Consider shorter sessions for better results.`,
        icon: '📈'
      });
    } else if (weeklyStats.completionRate > 0) {
      insights.push({
        type: 'improvement',
        title: 'Room for Growth',
        message: `Try ${preferences.optimalDuration || 20}-minute sessions - your completion rate could improve!`,
        icon: '💡'
      });
    }
    
    // Duration optimization insights
    if (preferences.bestCompletionRate > weeklyStats.completionRate + 10) {
      insights.push({
        type: 'suggestion',
        title: 'Optimize Your Timer',
        message: `Your best results come from ${preferences.optimalDuration}-minute sessions (${preferences.bestCompletionRate}% completion rate).`,
        icon: '⚡'
      });
    }
    
    // ADHD-friendly insights
    if (preferences.optimalDuration <= 20) {
      insights.push({
        type: 'adhd',
        title: 'ADHD-Friendly Pattern',
        message: `Short sessions (${preferences.optimalDuration} min) work best for you. This is excellent for sustained attention!`,
        icon: '🧠'
      });
    }
    
    // Weekly progress insights
    if (weeklyStats.totalFocusTime >= 120) { // 2+ hours
      const hours = Math.floor(weeklyStats.totalFocusTime / 60);
      const minutes = weeklyStats.totalFocusTime % 60;
      insights.push({
        type: 'achievement',
        title: 'Weekly Goal Achieved!',
        message: `You've focused for ${hours}h ${minutes}m this week. Keep up the momentum!`,
        icon: '🏆'
      });
    }
    
    return insights;
  }

  // Notification System Methods
  async showTimerCompleteNotification() {
    try {
      const duration = Math.round(this.timerState.duration / (60 * 1000));
      const isBreakMode = this.timerState.mode === 'break';
      
      // Open full-page notification overlay
      const notificationType = isBreakMode ? 'break-complete' : 'focus-complete';
      const overlayUrl = chrome.runtime.getURL(`break-notification.html?type=${notificationType}&duration=${duration}`);
      
      // Create new tab with the notification overlay
      await chrome.tabs.create({
        url: overlayUrl,
        active: true
      });
      
      // Play notification sound if enabled
      await this.playNotificationSound();
      
      // Update browser badge
      await this.updateBrowserBadge();
      
      // Track timer completion analytics
      await this.trackTimerCompletion(isBreakMode ? 'break' : 'focus', duration);
      
      // Broadcast to all extension views for immediate UI update
      chrome.runtime.sendMessage({
        type: 'timerComplete',
        mode: this.timerState.mode,
        duration: duration,
        notification: notificationData
      }).catch(() => {});

    } catch (error) {
      console.warn('Failed to show timer complete notification:', error);
      // Fallback: still add basic notification
      await this.addNotification({
        type: 'timer-complete',
        title: 'Timer Complete',
        message: `Your timer has finished`,
        iconType: 'timer'
      });
    }
  }

  async addNotification(notification) {
    try {
      const stored = await this.safeStorageGet(['notifications'], { notifications: [] });
      const notifications = stored.notifications;
      
      const newNotification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        read: false,
        ...notification
      };
      
      notifications.unshift(newNotification);
      
      // Keep only last 50 notifications
      if (notifications.length > 50) {
        notifications.splice(50);
      }
      
      await this.safeStorageSet({ notifications });
      
      // Update badge count
      await this.updateBrowserBadge();
      
      return newNotification.id;
    } catch (error) {
      console.warn('Failed to add notification:', error);
    }
  }

  async getNotifications() {
    try {
      const stored = await this.safeStorageGet(['notifications'], { notifications: [] });
      return stored.notifications;
    } catch (error) {
      console.warn('Failed to get notifications:', error);
      return [];
    }
  }

  async markNotificationRead(notificationId) {
    try {
      const stored = await this.safeStorageGet(['notifications'], { notifications: [] });
      const notifications = stored.notifications;
      
      const notification = notifications.find(n => n.id === notificationId);
      if (notification) {
        notification.read = true;
        await this.safeStorageSet({ notifications });
        await this.updateBrowserBadge();
      }
    } catch (error) {
      console.warn('Failed to mark notification as read:', error);
    }
  }

  async clearNotification(notificationId) {
    try {
      const stored = await this.safeStorageGet(['notifications'], { notifications: [] });
      const notifications = stored.notifications.filter(n => n.id !== notificationId);
      
      await this.safeStorageSet({ notifications });
      await this.updateBrowserBadge();
    } catch (error) {
      console.warn('Failed to clear notification:', error);
    }
  }

  async clearAllNotifications() {
    try {
      await this.safeStorageSet({ notifications: [] });
      await this.updateBrowserBadge();
    } catch (error) {
      console.warn('Failed to clear all notifications:', error);
    }
  }

  async updateBrowserBadge() {
    try {
      const notifications = await this.getNotifications();
      const unreadCount = notifications.filter(n => !n.read).length;
      
      if (this.timerState.isRunning) {
        // Show timer indicator when running
        chrome.action.setBadgeText({ text: '●' });
        chrome.action.setBadgeBackgroundColor({ color: '#007aff' });
      } else if (unreadCount > 0) {
        // Show notification count
        chrome.action.setBadgeText({ text: unreadCount.toString() });
        chrome.action.setBadgeBackgroundColor({ color: '#ff3b30' });
      } else {
        // Clear badge
        chrome.action.setBadgeText({ text: '' });
      }
    } catch (error) {
      console.warn('Failed to update browser badge:', error);
    }
  }

  async startTimer(duration) {
    try {
      const durationMs = duration * 60 * 1000; // Convert minutes to milliseconds
      
      if (this.timerState.isRunning && this.timerState.pausedTime) {
        // Resume from pause
        this.timerState.startTime = Date.now() - (this.timerState.duration - this.timerState.timeRemaining);
        this.timerState.pausedTime = null;
      } else {
        // Start new timer
        this.timerState.duration = durationMs;
        this.timerState.timeRemaining = durationMs;
        this.timerState.startTime = Date.now();
      }
      
      this.timerState.isRunning = true;
      await this.saveTimerState();
      this.startBackgroundTimer();
      
      // Update badge to show timer is running
      await this.updateBrowserBadge();
      
      // Track timer start event
      await this.trackTimerEvent({
        event: 'start',
        duration: this.timerState.duration,
        timestamp: Date.now()
      });
    } catch (error) {
      console.warn('Failed to start timer:', error);
    }
  }

  async pauseTimer() {
    try {
      this.timerState.isRunning = false;
      this.timerState.pausedTime = Date.now();
      
      // Calculate remaining time
      if (this.timerState.startTime) {
        const elapsed = this.timerState.pausedTime - this.timerState.startTime;
        this.timerState.timeRemaining = Math.max(0, this.timerState.duration - elapsed);
        
        // Record incomplete session when paused (if significant time elapsed)
        const sessionDuration = elapsed / (60 * 1000); // Convert to minutes
        if (sessionDuration >= 1) { // Only record if at least 1 minute elapsed
          await this.recordFocusSession({
            duration: this.timerState.duration / (60 * 1000), // Original duration in minutes
            completed: false,
            startTime: this.timerState.startTime,
            endTime: this.timerState.pausedTime,
            actualDuration: sessionDuration
          });
          
          // Update daily progress with actual time spent
          await this.updateDailyProgress(sessionDuration);
        }
      }
      
      this.stopBackgroundTimer();
      await this.saveTimerState();
      
      // Update badge to clear timer indicator
      await this.updateBrowserBadge();
      
      // Track timer pause event
      await this.trackTimerEvent({
        event: 'pause',
        duration: this.timerState.duration - this.timerState.timeRemaining,
        timestamp: Date.now()
      });
    } catch (error) {
      console.warn('Failed to pause timer:', error);
    }
  }

  async resetTimer(duration) {
    try {
      const durationMs = duration * 60 * 1000;
      
      // Preserve the mode when resetting
      const currentMode = this.timerState.mode || 'focus';
      
      this.timerState = {
        isRunning: false,
        startTime: null,
        duration: durationMs,
        timeRemaining: durationMs,
        pausedTime: null,
        mode: currentMode,
        cycleCount: this.timerState.cycleCount || 0
      };
      
      this.stopBackgroundTimer();
      await this.saveTimerState();
      
      // Update badge to clear timer indicator
      await this.updateBrowserBadge();
      
      // Track timer reset event
      await this.trackTimerEvent({
        event: 'reset',
        duration: 0,
        timestamp: Date.now()
      });
    } catch (error) {
      console.warn('Failed to reset timer:', error);
    }
  }

  async playNotificationSound() {
    try {
      const settings = await this.safeStorageGet(['settings'], { settings: { notificationSound: 'subtle' } });
      
      // Only play sound if enabled
      if (settings.settings.notificationSound !== 'none') {
        // Send message to active tab to play sound
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs.length > 0) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'playNotificationSound',
            soundType: settings.settings.notificationSound
          }).catch(() => {});
        }
      }
    } catch (error) {
      console.warn('Failed to play notification sound:', error);
    }
  }

  async getSuggestedFocusDuration() {
    try {
      const analytics = await this.getFocusAnalytics();
      // Return optimal duration based on user patterns
      return analytics.preferences.optimalDuration || 25;
    } catch (error) {
      return 25; // Default to 25 minutes
    }
  }

  async trackTimerCompletion(mode, duration) {
    try {
      const analytics = await this.safeStorageGet(['timerAnalytics'], { 
        timerAnalytics: {
          focusSessions: 0,
          breakSessions: 0,
          totalFocusTime: 0,
          totalBreakTime: 0,
          dailyStreak: 0,
          lastSessionDate: null,
          cyclesCompleted: 0
        }
      });
      
      const now = new Date();
      const today = now.toDateString();
      const lastSession = analytics.timerAnalytics.lastSessionDate;
      
      // Update analytics based on mode
      if (mode === 'focus') {
        analytics.timerAnalytics.focusSessions++;
        analytics.timerAnalytics.totalFocusTime += duration;
      } else {
        analytics.timerAnalytics.breakSessions++;
        analytics.timerAnalytics.totalBreakTime += duration;
        // Count a cycle when break completes (focus -> break = 1 cycle)
        analytics.timerAnalytics.cyclesCompleted++;
      }
      
      // Update daily streak
      if (lastSession !== today) {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastSession === yesterday.toDateString()) {
          analytics.timerAnalytics.dailyStreak++;
        } else {
          analytics.timerAnalytics.dailyStreak = 1;
        }
      }
      
      analytics.timerAnalytics.lastSessionDate = today;
      
      await this.safeStorageSet({ timerAnalytics: analytics.timerAnalytics });
    } catch (error) {
      console.warn('Failed to track timer completion:', error);
    }
  }

  async startBreakTimer(duration = 5) {
    console.log('🔵 Starting break timer:', duration, 'minutes');
    this.timerState.mode = 'break';
    await this.startTimer(duration);
    console.log('🔵 Break timer started, state:', this.timerState);
    
    // Show browser notification
    if (chrome.notifications) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon-128.png',
        title: 'Break Time! ☕',
        message: `${duration}-minute break started. Time to relax!`,
        priority: 2
      });
    }
  }

  async startFocusTimer(duration) {
    console.log('🔵 Starting focus timer:', duration, 'minutes');
    this.timerState.mode = 'focus';
    await this.startTimer(duration || 25);
    console.log('🔵 Focus timer started, state:', this.timerState);
  }
  
  async handleBreakNotificationAction(action, customDuration) {
    console.log('🟢 handleBreakNotificationAction called:', action, customDuration);
    try {
      switch (action) {
        case 'break5':
          console.log('🟢 Handling break5 action');
          await this.startBreakTimer(5);
          console.log('🟢 break5 completed');
          break;
        case 'break10':
          console.log('🟢 Handling break10 action');
          await this.startBreakTimer(10);
          console.log('🟢 break10 completed');
          break;
        case 'customBreak':
          // Custom break duration
          if (customDuration && customDuration >= 2 && customDuration <= 60) {
            await this.startBreakTimer(customDuration);
          } else {
            console.warn('Invalid custom break duration:', customDuration);
          }
          break;
        case 'skip':
          // User skipped break, just reset to focus mode
          await this.resetTimer(25);
          this.timerState.mode = 'focus';
          await this.saveTimerState();
          break;
        case 'focus':
          await this.startFocusTimer(25);
          break;
        case 'focus15':
          await this.startFocusTimer(15);
          break;
        case 'focus25':
          await this.startFocusTimer(25);
          break;
        case 'focus45':
          await this.startFocusTimer(45);
          break;
        case 'customFocus':
          // Custom focus duration
          if (customDuration && customDuration >= 5 && customDuration <= 90) {
            await this.startFocusTimer(customDuration);
          } else {
            console.warn('Invalid custom focus duration:', customDuration);
          }
          break;
        case 'extend':
          // Extend break by 5 minutes
          await this.startBreakTimer(5);
          break;
        case 'done':
          // User is done for now, just reset timer
          await this.resetTimer(25);
          break;
        default:
          console.warn('Unknown break notification action:', action);
      }
    } catch (error) {
      console.error('Failed to handle break notification action:', error);
    }
  }

  async handleNotificationAction(notification) {
    try {
      if (notification.action && notification.action.type === 'timer') {
        // Handle timer actions from notifications
        const { mode, duration } = notification.action;
        
        if (mode === 'break') {
          await this.startBreakTimer(duration);
        } else if (mode === 'focus') {
          await this.startFocusTimer(duration);
        }
        
        // Mark notification as read
        await this.markNotificationRead(notification.id);
        
        // Close popup to let user focus
        chrome.runtime.sendMessage({
          type: 'closePopup'
        }).catch(() => {});
      }
    } catch (error) {
      console.warn('Failed to handle notification action:', error);
    }
  }

  async trackAnalyticsEvent(event) {
    try {
      // Get existing analytics
      const { analytics = [] } = await this.safeStorageGet(['analytics']);
      
      // Add new event
      analytics.push({
        ...event,
        sessionId: this.sessionId || Date.now(),
        userAgent: navigator.userAgent,
        extensionVersion: chrome.runtime.getManifest().version
      });
      
      // Keep only last 1000 events
      const recentAnalytics = analytics.slice(-1000);
      
      // Store updated analytics
      await this.safeStorageSet({ analytics: recentAnalytics });
      
      // Log for debugging (remove in production)
      console.log('Analytics event tracked:', event.name, event.properties);
    } catch (error) {
      console.warn('Failed to track analytics event:', error);
    }
  }

  async handleProActivation(data) {
    try {
      const { email, features } = data;
      
      // Store Pro activation details
      await this.safeStorageSet({
        isPro: true,
        proEmail: email,
        proFeatures: features,
        proActivatedAt: Date.now()
      });
      
      // Track activation
      await this.trackAnalyticsEvent({
        name: 'pro_activated',
        category: 'subscription',
        properties: {
          email,
          features: Object.keys(features).filter(f => features[f]),
          source: 'upgrade_modal'
        }
      });
      
      // Send welcome notification
      await this.addNotification({
        id: `welcome-pro-${Date.now()}`,
        type: 'pro-welcome',
        title: 'Welcome to Smart Bookmarks Pro!',
        message: 'All Pro features are now unlocked. Check out the analytics dashboard!',
        iconType: 'achievement',
        timestamp: Date.now(),
        read: false
      });
      
      console.log('Pro features activated for:', email);
    } catch (error) {
      console.error('Failed to handle Pro activation:', error);
    }
  }
  
  async handleOAuthCallback(accessToken, refreshToken) {
    try {
      // Store tokens in chrome storage
      await chrome.storage.local.set({
        supabase_access_token: accessToken,
        supabase_refresh_token: refreshToken
      });
      
      // Sync subscription status
      await this.syncSubscriptionStatus();
      
      // Notify all tabs about auth state change
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, {
            type: 'AUTH_STATE_CHANGED',
            isAuthenticated: true
          }).catch(() => {});
        });
      });
      
      // Also notify popup if it's open
      chrome.runtime.sendMessage({
        type: 'AUTH_STATE_CHANGED',
        isAuthenticated: true
      }).catch(() => {});
      
      return { success: true };
    } catch (error) {
      console.error('OAuth callback error:', error);
      return { success: false, error: error.message };
    }
  }
  
  async syncSubscriptionStatus() {
    try {
      // Get stored tokens
      const { supabase_access_token } = await chrome.storage.local.get(['supabase_access_token']);
      
      if (!supabase_access_token) {
        console.log('No auth token found for subscription sync');
        return;
      }
      
      // Check if configured before making API call
      if (!this.isConfigured) {
        console.error('Cannot sync subscription: Supabase not configured');
        return;
      }
      
      // Make direct API call to check subscription
      const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/rpc/get_user_subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase_access_token}`,
          'apikey': SUPABASE_CONFIG.anonKey
        }
      });
      
      if (response.ok) {
        const subscription = await response.json();
        
        // Store subscription status
        await chrome.storage.local.set({
          subscription_status: {
            isPro: subscription && (subscription.status === 'active' || subscription.status === 'trialing'),
            tier: subscription?.tier || 'free',
            status: subscription?.status || 'inactive'
          }
        });
        
        // Update badge if Pro
        if (subscription && subscription.status === 'active') {
          chrome.action.setBadgeText({ text: 'PRO' });
          chrome.action.setBadgeBackgroundColor({ color: '#4A90E2' });
        } else {
          chrome.action.setBadgeText({ text: '' });
        }
        
        console.log('Subscription status synced:', subscription);
      }
    } catch (error) {
      console.error('Failed to sync subscription status:', error);
    }
  }
  
  async getSharedNote(noteId) {
    try {
      // Get notes from storage
      const { notes = [] } = await this.safeStorageGet(['notes']);
      
      // Find note by ID
      const note = notes.find(n => n.id === noteId);
      
      if (note) {
        // Return sanitized note data for sharing
        return {
          title: note.title || 'Untitled Note',
          content: note.content || '',
          htmlContent: note.htmlContent || note.content || '',
          category: note.category || 'general',
          timestamp: note.timestamp || Date.now()
        };
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get shared note:', error);
      return null;
    }
  }
  
  async createCheckoutSession(request) {
    try {
      // Get auth token for authenticated request
      const { supabase_access_token } = await chrome.storage.local.get(['supabase_access_token']);
      
      if (!supabase_access_token) {
        return { 
          success: false, 
          error: 'Authentication required. Please sign in to continue.' 
        };
      }
      
      // Check if configured before making API call
      if (!this.isConfigured) {
        return { 
          success: false, 
          error: 'Supabase not configured. Please set up config.local.js' 
        };
      }
      
      // Call Supabase Edge Function to create Stripe checkout session
      const response = await fetch(`${SUPABASE_CONFIG.url}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase_access_token}`,
          'apikey': SUPABASE_CONFIG.anonKey
        },
        body: JSON.stringify({
          priceId: request.priceId,
          successUrl: request.successUrl || chrome.runtime.getURL('payment-success.html'),
          cancelUrl: request.cancelUrl || chrome.runtime.getURL('popup.html'),
          metadata: {
            extensionId: chrome.runtime.id,
            source: request.source || 'extension_popup'
          }
        })
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Failed to create checkout session:', errorData);
        return {
          success: false,
          error: 'Failed to create checkout session. Please try again.'
        };
      }
      
      const data = await response.json();
      
      if (data.url) {
        // Open Stripe checkout in a new tab
        chrome.tabs.create({ url: data.url });
        
        // Track checkout creation
        await this.trackAnalyticsEvent({
          name: 'checkout_session_created',
          category: 'billing',
          properties: {
            priceId: request.priceId,
            source: request.source || 'extension_popup'
          }
        });
        
        return {
          success: true,
          checkoutUrl: data.url,
          sessionId: data.sessionId
        };
      } else {
        return {
          success: false,
          error: 'Invalid response from server'
        };
      }
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      return {
        success: false,
        error: error.message || 'Failed to create checkout session'
      };
    }
  }
}

new SmartBookmarksBackground();