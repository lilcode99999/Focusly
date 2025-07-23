class WebsiteTimeTracker {
  constructor() {
    this.isActive = true;
    this.startTime = Date.now();
    this.lastActivity = Date.now();
    this.idleThreshold = 60000; // 1 minute
    this.currentSession = {
      url: window.location.href,
      domain: window.location.hostname,
      title: document.title,
      startTime: this.startTime,
      activeTime: 0,
      idleTime: 0
    };
    
    this.settings = {};
    this.isBlocked = false;
    this.timeLimit = null;
    this.timeSpentToday = 0;
    
    this.init();
  }
  
  async init() {
    await this.loadSettings();
    await this.checkTimeSpent();
    
    if (this.settings.enableTimeTracking) {
      this.startTracking();
    }
    
    if (this.shouldBlockSite()) {
      this.showBlockedOverlay();
    }
  }
  
  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['settings', 'blockedSites']);
      this.settings = result.settings || {};
      this.blockedSites = result.blockedSites || [];
      this.idleThreshold = (this.settings.idleDetection || 60) * 1000;
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }
  
  startTracking() {
    // Track user activity
    this.setupActivityListeners();
    
    // Update session every 10 seconds
    this.trackingInterval = setInterval(() => {
      this.updateSession();
    }, 10000);
    
    // Send session data every minute
    this.reportingInterval = setInterval(() => {
      this.reportSession();
    }, 60000);
    
    // Handle page unload
    window.addEventListener('beforeunload', () => {
      this.endSession();
    });
    
    // Handle visibility change (tab switching)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseSession();
      } else {
        this.resumeSession();
      }
    });
  }
  
  setupActivityListeners() {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, () => {
        this.registerActivity();
      }, { passive: true });
    });
  }
  
  registerActivity() {
    this.lastActivity = Date.now();
    
    if (!this.isActive) {
      this.isActive = true;
      this.resumeSession();
    }
  }
  
  updateSession() {
    const now = Date.now();
    const timeSinceLastActivity = now - this.lastActivity;
    
    // Check if user is idle
    if (timeSinceLastActivity > this.idleThreshold) {
      if (this.isActive) {
        this.isActive = false;
        this.pauseSession();
      }
      return;
    }
    
    // Update active time
    if (this.isActive && !document.hidden) {
      this.currentSession.activeTime = now - this.currentSession.startTime - this.currentSession.idleTime;
    }
  }
  
  pauseSession() {
    if (this.isActive) {
      this.currentSession.idleTime += Date.now() - this.lastActivity;
    }
  }
  
  resumeSession() {
    this.lastActivity = Date.now();
    this.isActive = true;
  }
  
  async reportSession() {
    if (this.currentSession.activeTime > 0) {
      try {
        await chrome.runtime.sendMessage({
          action: 'recordTimeSession',
          session: {
            ...this.currentSession,
            timestamp: Date.now()
          }
        });
      } catch (error) {
        console.error('Failed to report session:', error);
      }
    }
  }
  
  endSession() {
    this.updateSession();
    this.reportSession();
    
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
    }
    if (this.reportingInterval) {
      clearInterval(this.reportingInterval);
    }
  }
  
  async checkTimeSpent() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'getTimeSpentToday',
        domain: window.location.hostname
      });
      
      this.timeSpentToday = response.timeSpent || 0;
    } catch (error) {
      console.error('Failed to check time spent:', error);
    }
  }
  
  shouldBlockSite() {
    const domain = window.location.hostname;
    const blockedSites = this.blockedSites || [];
    
    // Check if site is in blocked list
    const isBlocked = blockedSites.some(site => 
      domain.includes(site) || site.includes(domain)
    );
    
    if (!isBlocked) return false;
    
    // Check time limits (Pro feature)
    if (this.settings.timeBasedBlocking && this.timeLimit) {
      return this.timeSpentToday >= this.timeLimit;
    }
    
    // Check focus mode
    return this.checkFocusMode();
  }
  
  async checkFocusMode() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'getFocusMode'
      });
      
      return response.isFocusMode || false;
    } catch (error) {
      console.error('Failed to check focus mode:', error);
      return false;
    }
  }
  
  showBlockedOverlay() {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'smart-bookmarks-block-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.95);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    `;
    
    overlay.innerHTML = `
      <div style="text-align: center; max-width: 400px; padding: 40px;">
        <div style="font-size: 48px; margin-bottom: 20px;">🚫</div>
        <h1 style="font-size: 24px; margin-bottom: 16px; font-weight: 600;">Site Blocked</h1>
        <p style="font-size: 16px; margin-bottom: 24px; color: #a1a1a6;">
          This site is blocked during focus sessions to help you stay productive.
        </p>
        <div style="display: flex; gap: 12px; justify-content: center;">
          <button id="override-btn" style="
            padding: 12px 24px;
            background: #007aff;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
          ">Override (5 min)</button>
          <button id="close-tab-btn" style="
            padding: 12px 24px;
            background: transparent;
            color: #a1a1a6;
            border: 1px solid #3a3a3c;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
          ">Close Tab</button>
        </div>
        <p style="font-size: 12px; color: #6d6d70; margin-top: 16px;">
          Staying focused helps you achieve your goals faster
        </p>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Handle buttons
    overlay.querySelector('#override-btn').addEventListener('click', () => {
      this.handleOverride();
    });
    
    overlay.querySelector('#close-tab-btn').addEventListener('click', () => {
      window.close();
    });
  }
  
  handleOverride() {
    if (this.settings.emergencyOverride) {
      const phrase = prompt('Type "I need to access this site" to continue:');
      if (phrase === 'I need to access this site') {
        this.removeBlockOverlay();
        this.grantTemporaryAccess();
      }
    } else {
      this.removeBlockOverlay();
      this.grantTemporaryAccess();
    }
  }
  
  grantTemporaryAccess() {
    // Grant 5 minutes of access
    chrome.runtime.sendMessage({
      action: 'grantTemporaryAccess',
      domain: window.location.hostname,
      duration: 5 * 60 * 1000 // 5 minutes
    });
    
    // Show notification
    this.showNotification('Temporary access granted for 5 minutes', 'warning');
    
    // Set timer to re-block after 5 minutes
    setTimeout(() => {
      if (this.shouldBlockSite()) {
        this.showBlockedOverlay();
      }
    }, 5 * 60 * 1000);
  }
  
  removeBlockOverlay() {
    const overlay = document.getElementById('smart-bookmarks-block-overlay');
    if (overlay) {
      overlay.remove();
    }
  }
  
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      background: #007aff;
      color: white;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      font-size: 14px;
      z-index: 999998;
      transform: translateX(100%);
      transition: transform 0.3s ease-out;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    `;
    
    if (type === 'warning') {
      notification.style.background = '#ff9500';
    } else if (type === 'error') {
      notification.style.background = '#ff3b30';
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 10);
    
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
  
  // ADHD-friendly time awareness features
  showTimeAwareness() {
    if (!this.settings.timeBlindnessSupport) return;
    
    const timeSpent = Math.floor(this.currentSession.activeTime / 60000); // minutes
    
    if (timeSpent > 0 && timeSpent % 30 === 0) { // Every 30 minutes
      this.showTimeReminder(timeSpent);
    }
  }
  
  showTimeReminder(minutes) {
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    
    let timeText = '';
    if (hours > 0) {
      timeText = `${hours}h ${remainingMins}m`;
    } else {
      timeText = `${minutes}m`;
    }
    
    this.showNotification(`You've been on this site for ${timeText}`, 'info');
  }
}

// Initialize time tracker if not in iframe
if (window === window.top) {
  new WebsiteTimeTracker();
}