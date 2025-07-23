class SmartBookmarksPopup {
  constructor() {
    // Core elements
    this.searchInput = document.getElementById('searchInput');
    this.resultsContainer = document.getElementById('resultsContainer');
    this.resultsCount = document.getElementById('resultsCount');
    this.searchModes = document.querySelectorAll('.search-mode');
    
    // Timer elements
    this.timerDisplay = document.getElementById('timerDisplay');
    this.timerToggle = document.getElementById('timerToggle');
    this.timerReset = document.getElementById('timerReset');
    this.timerDecrease = document.getElementById('timerDecrease');
    this.timerIncrease = document.getElementById('timerIncrease');
    
    // Header elements
    this.themeToggle = document.getElementById('themeToggle');
    this.settingsBtn = document.getElementById('settingsBtn');
    this.clearRecentsBtn = document.getElementById('clearRecentsBtn');
    
    // Notification elements with validation
    this.notificationBtn = document.getElementById('notificationBtn');
    this.notificationBadge = document.getElementById('notificationBadge');
    this.notificationPanel = document.getElementById('notificationPanel');
    this.clearAllNotificationsBtn = document.getElementById('clearAllNotifications');
    
    // Validate critical notification elements exist
    if (!this.notificationBtn || !this.notificationPanel) {
      console.warn('Critical notification DOM elements missing');
    }
    
    this.debounceTimer = null;
    this.currentSearchMode = 'semantic';
    this.timerUpdateInterval = null;
    this.timerState = {
      isRunning: false,
      timeRemaining: 25 * 60 * 1000, // 25 minutes in milliseconds
      duration: 25 * 60 * 1000
    };
    this.settings = {};
    this.notifications = [];
    this.notificationPanelOpen = false;
    
    this.init();
  }
  
  async init() {
    await this.loadSettings();
    await this.loadTimerState();
    
    // Check if user has seen welcome screen or is authenticated
    const stored = await chrome.storage.local.get(['hasSeenWelcome', 'userTier']);
    const hasSeenWelcome = stored.hasSeenWelcome;
    this.userTier = stored.userTier || 'new';
    
    // Always set up basic functionality
    this.setupTimer();
    this.setupHeaderActions();
    this.setupNotifications();
    this.setupKeyboardShortcuts();
    this.applyTheme();
    this.setupSettingsListener();
    this.startTimerUpdates();
    
    if (!hasSeenWelcome) {
      // Show welcome screen for new users
      this.showWelcomeScreen();
    } else {
      // Initialize based on user tier
      this.setupSearch();
      this.loadRecentBookmarks();
      
      // Check pro status without blocking functionality
      try {
        await this.checkProStatus();
      } catch (error) {
        console.error('Pro status check failed:', error);
      }
    }
    
    return;
    
    // Listen for auth state changes
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'AUTH_STATE_CHANGED') {
        // Refresh pro status and UI
        this.checkProStatus();
        this.loadBookmarks();
        if (message.isAuthenticated) {
          this.setupSearch();
          this.displayUserInfo();
        }
      }
    });
    
    // Focus search input
    setTimeout(() => this.searchInput.focus(), 100);
    
    // Clean up timer updates when window closes
    window.addEventListener('beforeunload', () => {
      if (this.timerUpdateInterval) {
        clearInterval(this.timerUpdateInterval);
      }
    });
  }
  
  async loadTimerState() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getTimerState' });
      if (response && response.timerState) {
        this.timerState = response.timerState;
        this.updateTimerDisplay();
        this.updateTimerUI();
      }
    } catch (error) {
      console.error('Failed to load timer state:', error);
    }
  }

  startTimerUpdates() {
    // Update timer display every second
    this.timerUpdateInterval = setInterval(async () => {
      await this.loadTimerState();
    }, 1000);
  }

  setupSettingsListener() {
    // Listen for storage changes to update timer duration in real-time
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'sync' && changes.settings) {
        const newSettings = changes.settings.newValue;
        if (newSettings && newSettings.timerDuration !== this.settings.timerDuration) {
          // Update timer duration and sync with UI
          this.settings.timerDuration = newSettings.timerDuration;
          this.updateDurationButtons();
          
          // If timer is not running, reset to new duration
          if (!this.timerState.isRunning) {
            this.resetTimer();
          }
        }
      }
    });
  }
  
  setupSearch() {
    this.searchInput.addEventListener('input', (e) => {
      this.debounceSearch(e.target.value);
    });
    
    this.searchModes.forEach(mode => {
      mode.addEventListener('click', async (e) => {
        await this.setSearchMode(e.target.dataset.mode);
        if (this.searchInput.value.trim() && this.currentSearchMode) {
          this.debounceSearch(this.searchInput.value);
        }
      });
    });
  }
  
  setupTimer() {
    this.timerToggle.addEventListener('click', () => {
      this.toggleTimer();
    });
    
    this.timerReset.addEventListener('click', () => {
      this.resetTimer();
    });
    
    this.timerDecrease.addEventListener('click', () => {
      this.adjustTimerDuration(-1);
    });
    
    this.timerIncrease.addEventListener('click', () => {
      this.adjustTimerDuration(1);
    });
    
    this.updateTimerDisplay();
    this.updateDurationButtons();
  }
  
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Cmd/Ctrl + K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        this.searchInput.focus();
        this.searchInput.select();
      }
      
      // Space to toggle timer when search is not focused
      if (e.key === ' ' && document.activeElement !== this.searchInput) {
        e.preventDefault();
        this.toggleTimer();
      }
      
      // Arrow keys to adjust timer duration when search is not focused
      if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && document.activeElement !== this.searchInput) {
        e.preventDefault();
        const change = e.key === 'ArrowUp' ? 1 : -1;
        this.adjustTimerDuration(change);
      }
      
      // Plus/Minus keys to adjust timer duration
      if ((e.key === '+' || e.key === '=' || e.key === '-') && document.activeElement !== this.searchInput) {
        e.preventDefault();
        const change = (e.key === '+' || e.key === '=') ? 1 : -1;
        this.adjustTimerDuration(change);
      }
      
      // Escape to clear search
      if (e.key === 'Escape') {
        this.searchInput.value = '';
        this.loadRecentBookmarks();
        this.searchInput.blur();
      }
    });
  }
  
  async setSearchMode(mode) {
    // Check if semantic search requires Pro
    if (mode === 'semantic' && !this.isPro) {
      this.showNotification('Semantic AI search is a Pro feature', 'warning');
      // Show upgrade modal
      upgradeModalReal.open();
      return;
    }
    
    this.currentSearchMode = mode;
    this.searchModes.forEach(m => m.classList.remove('active'));
    document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
  }
  
  debounceSearch(query) {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.performSearch(query);
    }, 200);
  }
  
  async performSearch(query) {
    if (!query.trim()) {
      this.loadRecentBookmarks();
      return;
    }
    
    this.showLoadingState();
    
    try {
      const bookmarks = await this.searchBookmarks(query, this.currentSearchMode);
      this.displayResults(bookmarks, query);
    } catch (error) {
      console.error('Search error:', error);
      this.showErrorState('Search failed. Please try again.');
    }
  }
  
  async searchBookmarks(query, type) {
    if (this.userTier === 'free') {
      // Use local search for free tier
      return await this.searchLocalBookmarks(query);
    } else {
      // Use original search for authenticated users
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({
          action: 'searchBookmarks',
          query: query,
          type: type
        }, (response) => {
          resolve(response?.bookmarks || []);
        });
      });
    }
  }
  
  async loadRecentBookmarks() {
    try {
      const bookmarks = await this.getRecentBookmarks();
      if (bookmarks.length === 0) {
        this.showEmptyState(
          'No bookmarks yet', 
          'Start bookmarking pages to see them here'
        );
      } else {
        this.displayResults(bookmarks, null, 'Recent');
      }
    } catch (error) {
      console.error('Failed to load recent bookmarks:', error);
      this.showEmptyState('Failed to load bookmarks', 'Please try again');
    }
  }
  
  async getRecentBookmarks() {
    if (this.userTier === 'free') {
      // Use local bookmarks for free tier
      return await this.getLocalBookmarks();
    } else {
      // Use original method for authenticated users
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({
          action: 'getRecentBookmarks',
          limit: 10
        }, (response) => {
          resolve(response?.bookmarks || []);
        });
      });
    }
  }
  
  displayResults(bookmarks, query = null, title = null) {
    const resultsTitle = title || (query ? 'Search Results' : 'Recent');
    document.querySelector('.results-title').textContent = resultsTitle;
    
    if (bookmarks.length === 0) {
      if (query) {
        this.showEmptyState('No bookmarks found', `Try different keywords or switch to ${this.currentSearchMode === 'semantic' ? 'keyword' : 'semantic'} search`);
      } else {
        this.showEmptyState('No bookmarks yet', 'Start bookmarking pages to see them here');
      }
      return;
    }
    
    this.resultsCount.textContent = `${bookmarks.length} ${bookmarks.length === 1 ? 'result' : 'results'}`;
    
    this.resultsContainer.innerHTML = bookmarks.map(bookmark => `
      <div class="bookmark-item" data-url="${this.escapeHtml(bookmark.url)}" tabindex="0">
        <img class="bookmark-favicon" src="${this.getFavicon(bookmark.url)}" alt="" loading="lazy">
        <div class="bookmark-content">
          <div class="bookmark-title">${this.highlightQuery(this.escapeHtml(bookmark.title), query)}</div>
          <div class="bookmark-url">${this.escapeHtml(this.formatUrl(bookmark.url))}</div>
          <div class="bookmark-meta">
            <span class="bookmark-time">${this.formatDate(bookmark.dateAdded)}</span>
            ${bookmark.tags ? bookmark.tags.map(tag => `<span class="bookmark-tag">${this.escapeHtml(tag)}</span>`).join('') : ''}
          </div>
        </div>
      </div>
    `).join('');
    
    this.bindResultsEvents();
  }
  
  bindResultsEvents() {
    this.resultsContainer.querySelectorAll('.bookmark-item').forEach(item => {
      const openBookmark = () => {
        const url = item.dataset.url;
        this.trackBookmarkClick(url);
        chrome.tabs.create({ url: url });
        window.close();
      };
      
      item.addEventListener('click', openBookmark);
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openBookmark();
        }
      });
    });
  }
  
  trackBookmarkClick(url) {
    chrome.runtime.sendMessage({
      action: 'trackBookmarkClick',
      url: url,
      timestamp: Date.now(),
      timerActive: this.isTimerRunning
    });
  }
  
  showLoadingState() {
    this.resultsCount.textContent = '';
    this.resultsContainer.innerHTML = `
      <div class="loading-state">
        <div class="loading-spinner"></div>
        Searching...
      </div>
    `;
  }
  
  showEmptyState(title = 'Start searching', subtitle = 'Type to find your bookmarks instantly') {
    this.resultsCount.textContent = '';
    this.resultsContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-title">${title}</div>
        <div class="empty-state-subtitle">${subtitle}</div>
      </div>
    `;
  }
  
  showErrorState(message) {
    this.resultsCount.textContent = '';
    this.resultsContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-title">Something went wrong</div>
        <div class="empty-state-subtitle">${message}</div>
      </div>
    `;
  }
  
  async toggleTimer() {
    if (this.timerState.isRunning) {
      await this.pauseTimer();
    } else {
      await this.startTimer();
    }
  }
  
  async startTimer() {
    try {
      const duration = this.settings.timerDuration || 25;
      await chrome.runtime.sendMessage({
        action: 'startTimer',
        duration: duration
      });
      await this.loadTimerState();
    } catch (error) {
      console.error('Failed to start timer:', error);
    }
  }
  
  async pauseTimer() {
    try {
      await chrome.runtime.sendMessage({ action: 'pauseTimer' });
      await this.loadTimerState();
    } catch (error) {
      console.error('Failed to pause timer:', error);
    }
  }
  
  async resetTimer() {
    try {
      const duration = this.settings.timerDuration || 25;
      await chrome.runtime.sendMessage({
        action: 'resetTimer',
        duration: duration
      });
      await this.loadTimerState();
    } catch (error) {
      console.error('Failed to reset timer:', error);
    }
  }
  
  updateTimerUI() {
    const isBreakMode = this.timerState.mode === 'break';
    const timerSection = document.getElementById('timerSection');
    
    // Update timer section styling for break mode
    if (isBreakMode) {
      timerSection.classList.add('break-mode');
    } else {
      timerSection.classList.remove('break-mode');
    }
    
    // Update button text based on timer state and mode
    if (this.timerState.isRunning) {
      this.timerToggle.textContent = 'Pause';
      this.timerToggle.classList.remove('primary');
    } else if (this.timerState.timeRemaining < this.timerState.duration && this.timerState.timeRemaining > 0) {
      this.timerToggle.textContent = 'Resume';
      this.timerToggle.classList.add('primary');
    } else {
      this.timerToggle.textContent = isBreakMode ? 'Start Break' : 'Start Focus';
      this.timerToggle.classList.add('primary');
    }
    
    // Update timer title
    const timerTitle = document.querySelector('.timer-title');
    if (timerTitle) {
      timerTitle.textContent = isBreakMode ? 'Break Timer 🌿' : 'Focus Timer 🎯';
    }
    
    this.updateDurationButtons();
  }

  async adjustTimerDuration(minuteChange) {
    try {
      const currentDurationMinutes = this.settings.timerDuration || 25;
      const newDurationMinutes = Math.max(1, Math.min(120, currentDurationMinutes + minuteChange));
      
      if (newDurationMinutes === currentDurationMinutes) {
        return; // No change needed
      }
      
      // Update settings
      this.settings.timerDuration = newDurationMinutes;
      await this.saveSettings();
      
      // If timer is not running, reset to new duration
      if (!this.timerState.isRunning) {
        await this.resetTimer();
      } else {
        // If timer is running, update the current session duration
        const currentElapsed = this.timerState.duration - this.timerState.timeRemaining;
        
        // Update background timer with new duration
        await chrome.runtime.sendMessage({
          action: 'updateTimerDuration',
          duration: newDurationMinutes,
          elapsed: currentElapsed
        });
        
        // Reload timer state to get updated values
        await this.loadTimerState();
      }
      
      this.updateDurationButtons();
      
      // Show a brief, non-intrusive notification
      const adhdFriendly = newDurationMinutes <= 20 ? ' (ADHD-friendly)' : '';
      this.showNotification(`${newDurationMinutes} min${adhdFriendly}`, 'success');
    } catch (error) {
      console.error('Failed to adjust timer duration:', error);
      this.showNotification('Failed to adjust timer duration', 'error');
    }
  }

  updateDurationButtons() {
    const currentDurationMinutes = this.settings.timerDuration || 25;
    
    // Disable buttons at limits
    this.timerDecrease.disabled = currentDurationMinutes <= 1;
    this.timerIncrease.disabled = currentDurationMinutes >= 120;
    
    // Update tooltips with current duration
    this.timerDecrease.title = `Decrease duration (${currentDurationMinutes} min)`;
    this.timerIncrease.title = `Increase duration (${currentDurationMinutes} min)`;
  }
  
  updateTimerDisplay() {
    const totalSeconds = Math.ceil(this.timerState.timeRemaining / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    this.timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  
  highlightQuery(text, query) {
    if (!query) return text;
    
    const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }
  
  formatUrl(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname + urlObj.pathname;
    } catch {
      return url;
    }
  }
  
  formatDate(timestamp) {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }
  
  getFavicon(url) {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
    } catch {
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiByeD0iNCIgZmlsbD0iI0Y1RjVGNSIvPgo8cGF0aCBkPSJNNCA2SDEyVjEwSDRWNloiIGZpbGw9IiNEMUQxRDEiLz4KPC9zdmc+';
    }
  }
  
  escapeHtml(text) {
    if (typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  
  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['settings']);
      this.settings = result.settings || {
        theme: 'system',
        defaultSearchMode: 'semantic',
        timerDuration: 25,
        compactMode: false
      };
      
      // Apply default search mode
      this.currentSearchMode = this.settings.defaultSearchMode;
      
      // Update duration buttons after settings load
      if (this.timerDecrease && this.timerIncrease) {
        this.updateDurationButtons();
      }
      
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }
  
  setupHeaderActions() {
    // Save bookmark button
    const saveBookmarkBtn = document.getElementById('saveBookmarkBtn');
    if (saveBookmarkBtn) {
      saveBookmarkBtn.addEventListener('click', () => {
        this.saveCurrentPage();
      });
    }

    // Theme toggle
    this.themeToggle.addEventListener('click', () => {
      this.toggleTheme();
    });
    
    // Settings button
    this.settingsBtn.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
    
    // Clear recents button
    this.clearRecentsBtn.addEventListener('click', () => {
      this.clearRecentBookmarks();
    });

    // Notification button
    if (this.notificationBtn) {
      this.notificationBtn.addEventListener('click', () => {
        this.toggleNotificationPanel();
      });
    }

    // Clear all notifications
    if (this.clearAllNotificationsBtn) {
      this.clearAllNotificationsBtn.addEventListener('click', () => {
        this.clearAllNotifications();
      });
    }

    // Click outside to close notifications
    document.addEventListener('click', (e) => {
      if (this.notificationBtn && this.notificationPanel) {
        if (!this.notificationBtn.contains(e.target) && !this.notificationPanel.contains(e.target)) {
          this.closeNotificationPanel();
        }
      }
    });
  }
  
  toggleTheme() {
    const themes = ['system', 'light', 'dark'];
    const currentIndex = themes.indexOf(this.settings.theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    
    this.settings.theme = themes[nextIndex];
    this.applyTheme();
    this.saveSettings();
  }
  
  applyTheme() {
    const body = document.body;
    const theme = this.settings.theme;
    
    // Remove existing theme attributes
    body.removeAttribute('data-theme');
    
    if (theme === 'dark') {
      body.setAttribute('data-theme', 'dark');
    } else if (theme === 'light') {
      body.setAttribute('data-theme', 'light');
    }
    // System theme handled by CSS media queries
    
    // Update theme toggle icon based on current theme
    this.updateThemeIcon();
  }
  
  updateThemeIcon() {
    const icon = this.themeToggle.querySelector('svg');
    const theme = this.settings.theme;
    
    // Use proper moon/sun icons instead of confusing monitor/TV icon
    if (theme === 'dark') {
      // Moon icon for dark mode
      icon.innerHTML = `<path d="M6 .278a.768.768 0 0 1 .08.858 7.208 7.208 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 0 1 .81.316.733.733 0 0 1-.031.893A8.349 8.349 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 0 1 6 .278z"/>`;
    } else if (theme === 'light') {
      // Sun icon for light mode
      icon.innerHTML = `<path d="M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zm0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13zm8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zM3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8zm10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.414a.5.5 0 1 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm-9.193 9.193a.5.5 0 0 1 0 .707L2.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707zM4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708z"/>`;
    } else {
      // Auto/system icon - use a combined sun/moon icon to indicate automatic theme switching
      icon.innerHTML = `<path d="M8 15A7 7 0 1 0 8 1v14zm0 1A8 8 0 1 1 8 0a8 8 0 0 1 0 16z"/>`;
    }
  }
  
  async clearRecentBookmarks() {
    if (confirm('Clear all recent bookmarks from the list? This will not delete your actual bookmarks.')) {
      try {
        await chrome.runtime.sendMessage({
          action: 'clearRecentBookmarks'
        });
        
        // Update the results title to indicate cleared state
        document.querySelector('.results-title').textContent = 'Recent';
        this.showEmptyState('Recent bookmarks cleared', 'Start searching or bookmarking pages to see them here');
        this.showNotification('Recent bookmarks cleared', 'success');
      } catch (error) {
        console.error('Failed to clear recents:', error);
        this.showNotification('Failed to clear recents', 'error');
      }
    }
  }
  
  async saveSettings() {
    try {
      await chrome.storage.sync.set({
        settings: this.settings
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }
  
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
      position: fixed;
      top: 16px;
      right: 16px;
      padding: 8px 12px;
      background: var(--accent-color);
      color: white;
      border-radius: 6px;
      font-size: 12px;
      z-index: 1000;
      transform: translateY(-100%);
      transition: transform 0.3s ease-out;
      box-shadow: var(--shadow-medium);
    `;
    
    if (type === 'error') {
      notification.style.background = 'var(--error-color)';
    } else if (type === 'success') {
      notification.style.background = 'var(--success-color)';
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.transform = 'translateY(0)';
    }, 10);
    
    setTimeout(() => {
      notification.style.transform = 'translateY(-100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 2000);
  }

  // Notification System Methods
  async setupNotifications() {
    try {
      console.log('Setting up notifications...');
      await this.loadNotifications();
      this.updateNotificationBadge();
      console.log('Notifications setup complete');
    } catch (error) {
      console.error('Failed to setup notifications:', error);
    }
  }

  async loadNotifications() {
    try {
      console.log('Loading notifications...');
      const response = await chrome.runtime.sendMessage({ action: 'getNotifications' });
      this.notifications = response?.notifications || [];
      console.log('Loaded notifications:', this.notifications.length);
      this.updateNotificationBadge();
      this.renderNotifications();
    } catch (error) {
      console.error('Failed to load notifications:', error);
      this.notifications = [];
      this.updateNotificationBadge();
      this.renderNotifications();
    }
  }

  updateNotificationBadge() {
    if (!this.notificationBadge) {
      console.warn('Notification badge element not found');
      return;
    }
    
    const unreadCount = this.notifications.filter(n => !n.read).length;
    
    if (unreadCount > 0) {
      this.notificationBadge.textContent = unreadCount.toString();
      this.notificationBadge.classList.remove('hidden');
    } else {
      this.notificationBadge.classList.add('hidden');
    }
  }

  toggleNotificationPanel() {
    if (this.notificationPanelOpen) {
      this.closeNotificationPanel();
    } else {
      this.openNotificationPanel();
    }
  }

  openNotificationPanel() {
    if (!this.notificationPanel) {
      console.warn('Notification panel element not found');
      return;
    }
    
    this.notificationPanel.classList.add('visible');
    this.notificationPanelOpen = true;
    
    // Mark all notifications as read when panel is opened
    this.markAllNotificationsRead();
  }

  closeNotificationPanel() {
    if (!this.notificationPanel) {
      console.warn('Notification panel element not found');
      return;
    }
    
    this.notificationPanel.classList.remove('visible');
    this.notificationPanelOpen = false;
  }

  async markAllNotificationsRead() {
    try {
      const unreadNotifications = this.notifications.filter(n => !n.read);
      
      for (const notification of unreadNotifications) {
        await chrome.runtime.sendMessage({
          action: 'markNotificationRead',
          notificationId: notification.id
        });
        notification.read = true;
      }
      
      this.updateNotificationBadge();
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  }

  async clearAllNotifications() {
    try {
      console.log('Clearing all notifications...');
      await chrome.runtime.sendMessage({ action: 'clearAllNotifications' });
      this.notifications = [];
      this.updateNotificationBadge();
      this.renderNotifications();
      console.log('All notifications cleared successfully');
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
      // Show user feedback even if clearing fails
      this.showNotification('Failed to clear notifications', 'error');
    }
  }

  async clearNotification(notificationId) {
    try {
      console.log('Clearing notification:', notificationId);
      await chrome.runtime.sendMessage({
        action: 'clearNotification',
        notificationId: notificationId
      });
      
      this.notifications = this.notifications.filter(n => n.id !== notificationId);
      this.updateNotificationBadge();
      this.renderNotifications();
      console.log('Notification cleared successfully:', notificationId);
    } catch (error) {
      console.error('Failed to clear notification:', error);
      this.showNotification('Failed to clear notification', 'error');
    }
  }

  renderNotifications() {
    const notificationList = document.getElementById('notificationList');
    const notificationEmpty = document.getElementById('notificationEmpty');
    
    // Add null checks to prevent style errors
    if (!notificationList || !notificationEmpty) {
      console.warn('Notification DOM elements not found - creating fallback');
      this.createFallbackNotificationElements();
      return;
    }
    
    if (this.notifications.length === 0) {
      notificationList.innerHTML = '';
      if (notificationEmpty) {
        notificationEmpty.style.display = 'block';
        // Make sure empty message is inside the list
        if (!notificationList.contains(notificationEmpty)) {
          notificationList.appendChild(notificationEmpty);
        }
      }
      return;
    }
    
    if (notificationEmpty) {
      notificationEmpty.style.display = 'none';
    }
    
    // Clear the list but preserve the empty element
    const tempEmpty = notificationEmpty.cloneNode(true);
    
    notificationList.innerHTML = this.notifications.map(notification => `
      <div class="notification-item ${notification.read ? 'read' : 'unread'}" data-id="${notification.id}">
        <div class="notification-icon">
          ${this.getNotificationIcon(notification.iconType)}
        </div>
        <div class="notification-content">
          <div class="notification-title">${this.escapeHtml(notification.title)}</div>
          <div class="notification-message">${this.escapeHtml(notification.message)}</div>
          <div class="notification-time">${this.formatNotificationTime(notification.timestamp)}</div>
          ${notification.action ? `
            <button class="notification-action-btn" data-notification='${JSON.stringify(notification)}'>
              ${this.escapeHtml(notification.action.label)}
            </button>
          ` : ''}
        </div>
        <button class="notification-close" data-notification-id="${notification.id}">×</button>
      </div>
    `).join('');
    
    // Re-append the empty element (hidden)
    notificationList.appendChild(tempEmpty);
    tempEmpty.style.display = 'none';
    
    // Add event listeners for notification close buttons
    notificationList.querySelectorAll('.notification-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const notificationId = btn.dataset.notificationId;
        this.clearNotification(notificationId);
      });
    });
    
    // Add event listeners for action buttons
    notificationList.querySelectorAll('.notification-action-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
          const notification = JSON.parse(btn.dataset.notification);
          await this.handleNotificationAction(notification);
        } catch (error) {
          console.error('Failed to handle notification action:', error);
        }
      });
    });
  }

  getNotificationIcon(iconType) {
    const icons = {
      timer: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12,6 12,12 16,14"></polyline>
      </svg>`,
      achievement: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 12l2 2 4-4"></path>
        <circle cx="12" cy="12" r="10"></circle>
      </svg>`,
      info: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>`
    };
    
    return icons[iconType] || icons.info;
  }

  formatNotificationTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;
    if (days < 7) return `${days} days ago`;
    
    return new Date(timestamp).toLocaleDateString();
  }

  createFallbackNotificationElements() {
    console.log('Creating fallback notification elements...');
    
    // Try to find the notification panel
    const notificationPanel = document.getElementById('notificationPanel');
    if (!notificationPanel) {
      console.error('Notification panel not found - unable to create fallback');
      return;
    }
    
    // Check if notification list exists, if not create it
    let notificationList = document.getElementById('notificationList');
    if (!notificationList) {
      notificationList = document.createElement('div');
      notificationList.className = 'notification-list';
      notificationList.id = 'notificationList';
      notificationPanel.appendChild(notificationList);
    }
    
    // Check if empty state exists, if not create it
    let notificationEmpty = document.getElementById('notificationEmpty');
    if (!notificationEmpty) {
      notificationEmpty = document.createElement('div');
      notificationEmpty.className = 'notification-empty';
      notificationEmpty.id = 'notificationEmpty';
      notificationEmpty.innerHTML = '<p>No notifications</p>';
      notificationList.appendChild(notificationEmpty);
    }
    
    console.log('Fallback notification elements created successfully');
    
    // Try rendering again
    this.renderNotifications();
  }

  async handleNotificationAction(notification) {
    try {
      // Send action to background script
      await chrome.runtime.sendMessage({
        action: 'handleNotificationAction',
        notification: notification
      });
      
      // Close notification panel
      this.closeNotificationPanel();
      
      // Show visual feedback
      this.showNotification('Timer started! 🚀', 'success');
    } catch (error) {
      console.error('Failed to handle notification action:', error);
      this.showNotification('Failed to start timer', 'error');
    }
  }

  async checkProStatus() {
    try {
      // Try to use real auth service first
      if (window.authService && authService.initialized) {
        const subscription = await authService.checkSubscriptionStatus();
        this.isPro = subscription.isPro;
        this.subscriptionTier = subscription.tier;
      } else {
        // Fallback to chrome storage
        const { isPro } = await chrome.storage.sync.get(['isPro']);
        this.isPro = isPro || false;
      }
      
      if (this.isPro) {
        this.removeBookmarkLimit();
        this.showProFeatures();
      } else {
        // Add Pro upgrade prompts
        this.addUpgradePrompts();
      }
    } catch (error) {
      console.error('Error checking pro status:', error);
      this.isPro = false;
      // Still add upgrade prompts for free users
      this.addUpgradePrompts();
    }
  }

  addUpgradePrompts() {
    // Add upgrade button to header
    const headerActions = document.querySelector('.header-actions');
    if (headerActions && !document.getElementById('upgradeBtn')) {
      const upgradeBtn = document.createElement('button');
      upgradeBtn.id = 'upgradeBtn';
      upgradeBtn.className = 'header-btn upgrade-btn';
      upgradeBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M2.866 14.85c-.078.444.36.791.746.593l4.39-2.256 4.389 2.256c.386.198.824-.149.746-.592l-.83-4.73 3.522-3.356c.33-.314.16-.888-.282-.95l-4.898-.696L8.465.792a.513.513 0 0 0-.927 0L5.354 5.12l-4.898.696c-.441.062-.612.636-.283.95l3.523 3.356-.83 4.73zm4.905-2.767-3.686 1.894.694-3.957a.565.565 0 0 0-.163-.505L1.71 6.745l4.052-.576a.525.525 0 0 0 .393-.288L8 2.223l1.847 3.658a.525.525 0 0 0 .393.288l4.052.575-2.906 2.77a.565.565 0 0 0-.163.506l.694 3.957-3.686-1.894a.503.503 0 0 0-.461 0z"/>
        </svg>
      `;
      upgradeBtn.title = 'Upgrade to Pro';
      upgradeBtn.addEventListener('click', () => {
        upgradeModalReal.open();
      });
      
      // Insert before first button
      headerActions.insertBefore(upgradeBtn, headerActions.firstChild);
    }

    // Check bookmark count for limit warning
    this.checkBookmarkLimit();
  }

  async checkBookmarkLimit() {
    try {
      // TEMPORARY: Skip auth check while fixing
      // const isAuthenticated = await authService.isAuthenticated();
      // if (!isAuthenticated) {
      //   authModal.show('signin');
      //   return false;
      // }
      
      const { isPro } = await chrome.storage.sync.get(['isPro']);
      const bookmarks = await this.getAllBookmarks();
      const bookmarkCount = bookmarks.length;
      
      if (!isPro && bookmarkCount >= 100) {
        // Hard limit reached
        this.showNotification('Bookmark limit reached! Upgrade to Pro for unlimited bookmarks.', 'warning');
        // Open upgrade modal
        upgradeModalReal.open();
        return false;
      } else if (!isPro && bookmarkCount >= 90) {
        // Show warning if approaching limit
        const limitWarning = document.createElement('div');
        limitWarning.className = 'limit-warning';
        limitWarning.innerHTML = `
          <span>⚠️ ${bookmarkCount}/100 bookmarks used</span>
          <button class="upgrade-link">Upgrade for unlimited</button>
        `;
        
        // Add to search section
        const searchSection = document.querySelector('.search-section');
        if (searchSection && !document.querySelector('.limit-warning')) {
          searchSection.appendChild(limitWarning);
          
          limitWarning.querySelector('.upgrade-link').addEventListener('click', () => {
            upgradeModalReal.open();
          });
        }
      }
      
      return true;
    } catch (error) {
      console.error('Failed to check bookmark limit:', error);
      return true;
    }
  }

  async getAllBookmarks() {
    return new Promise((resolve) => {
      chrome.bookmarks.getTree((tree) => {
        const bookmarks = [];
        const traverse = (nodes) => {
          for (const node of nodes) {
            if (node.url) {
              bookmarks.push(node);
            }
            if (node.children) {
              traverse(node.children);
            }
          }
        };
        traverse(tree);
        resolve(bookmarks);
      });
    });
  }

  showProFeatures() {
    // Add Pro badge to header
    const headerTitle = document.querySelector('.header-title');
    if (headerTitle && !document.querySelector('.pro-badge-inline')) {
      const proBadge = document.createElement('span');
      proBadge.className = 'pro-badge-inline';
      proBadge.textContent = 'PRO';
      headerTitle.appendChild(proBadge);
    }
  }
  
  showWelcomeScreen() {
    const container = document.getElementById('resultsContainer');
    container.innerHTML = `
      <div class="welcome-screen">
        <div class="welcome-icon">🚀</div>
        <h3>Welcome to Smart Bookmarks!</h3>
        <p>AI-powered semantic search for your bookmarks. Start exploring immediately with 100 free bookmarks.</p>
        
        <div class="welcome-features">
          <div class="feature-item">
            <span class="feature-icon">🔍</span>
            <span>Find bookmarks by meaning, not just keywords</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">⏱️</span>
            <span>Built-in focus timer with ADHD support</span>
          </div>
          <div class="feature-item">
            <span class="feature-icon">📊</span>
            <span>Track productivity patterns</span>
          </div>
        </div>
        
        <div class="welcome-actions">
          <button class="auth-btn" id="startFreeBtn">Start Free (100 bookmarks)</button>
          <button class="auth-btn secondary" id="signInLaterBtn">Sign In for Sync</button>
        </div>
        
        <div class="welcome-footer">
          <small>No account required to start • Upgrade anytime for unlimited bookmarks</small>
        </div>
      </div>
    `;
    
    // Set up welcome screen event listeners
    document.getElementById('startFreeBtn').addEventListener('click', () => {
      this.startFreeTier();
    });
    
    document.getElementById('signInLaterBtn').addEventListener('click', () => {
      this.showAuthPrompt();
    });
  }

  async startFreeTier() {
    // Set user to free tier mode
    await chrome.storage.local.set({
      userTier: 'free',
      hasSeenWelcome: true,
      freeBookmarkCount: 0,
      localBookmarks: []
    });
    
    // Initialize free tier functionality
    this.userTier = 'free';
    this.setupSearch();
    this.loadRecentBookmarks();
    
    // Show free tier success message
    this.showNotification('Welcome! You can now save up to 100 bookmarks locally.', 'success');
  }

  // Local bookmark management methods
  async saveBookmarkLocally(bookmark) {
    const stored = await chrome.storage.local.get(['localBookmarks', 'freeBookmarkCount']);
    const localBookmarks = stored.localBookmarks || [];
    const count = stored.freeBookmarkCount || 0;
    
    // Check free tier limit
    if (this.userTier === 'free' && count >= 100) {
      this.showUpgradePrompt('You\'ve reached the 100 bookmark limit for free accounts.');
      return false;
    }
    
    // Add timestamp and ID
    const localBookmark = {
      ...bookmark,
      id: 'local_' + Date.now(),
      dateAdded: Date.now(),
      source: 'local'
    };
    
    localBookmarks.unshift(localBookmark);
    
    await chrome.storage.local.set({
      localBookmarks,
      freeBookmarkCount: count + 1
    });
    
    this.showNotification('Bookmark saved locally!', 'success');
    this.loadRecentBookmarks();
    return true;
  }

  async getLocalBookmarks() {
    const stored = await chrome.storage.local.get(['localBookmarks']);
    return stored.localBookmarks || [];
  }

  async searchLocalBookmarks(query) {
    const localBookmarks = await this.getLocalBookmarks();
    
    if (!query) return localBookmarks.slice(0, 10);
    
    // Simple keyword search for local bookmarks
    const lowerQuery = query.toLowerCase();
    return localBookmarks.filter(bookmark => 
      bookmark.title.toLowerCase().includes(lowerQuery) ||
      bookmark.url.toLowerCase().includes(lowerQuery) ||
      (bookmark.description && bookmark.description.toLowerCase().includes(lowerQuery))
    ).slice(0, 10);
  }

  async saveCurrentPage() {
    try {
      // Get current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab) {
        this.showNotification('Could not get current tab', 'error');
        return;
      }

      // Skip extension pages
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
        this.showNotification('Cannot bookmark extension pages', 'warning');
        return;
      }

      const bookmark = {
        title: tab.title || 'Untitled',
        url: tab.url,
        description: '',
        dateAdded: Date.now()
      };

      // Save based on user tier
      if (this.userTier === 'free') {
        await this.saveBookmarkLocally(bookmark);
      } else {
        // For authenticated users, use original save method
        chrome.runtime.sendMessage({
          action: 'saveBookmark',
          bookmark: bookmark
        });
      }

    } catch (error) {
      console.error('Failed to save bookmark:', error);
      this.showNotification('Failed to save bookmark', 'error');
    }
  }

  showUpgradePrompt(message) {
    this.showNotification(message + ' Upgrade to Pro for unlimited bookmarks!', 'warning');
    
    // Add upgrade button to results
    const container = document.getElementById('resultsContainer');
    const upgradePrompt = document.createElement('div');
    upgradePrompt.className = 'limit-warning';
    upgradePrompt.innerHTML = `
      <span>${message}</span>
      <button class="upgrade-link">Upgrade to Pro</button>
    `;
    
    upgradePrompt.querySelector('.upgrade-link').addEventListener('click', () => {
      // Show upgrade modal
      if (window.upgradeModal) {
        window.upgradeModal.show();
      }
    });
    
    container.prepend(upgradePrompt);
  }

  showAuthPrompt() {
    // Updated auth prompt for progressive approach
    const container = document.getElementById('resultsContainer');
    container.innerHTML = `
      <div class="auth-prompt">
        <h3>Sync Across Devices</h3>
        <p>Sign in to sync your bookmarks across all devices and unlock Pro features.</p>
        <button class="auth-btn" id="signInBtn">Sign In</button>
        <button class="auth-btn secondary" id="signUpBtn">Create Account</button>
        <button class="auth-btn secondary" id="continueLocalBtn">Continue Locally</button>
      </div>
    `;
    
    // Set up auth prompt event listeners
    document.getElementById('signInBtn').addEventListener('click', () => {
      authModal.show('signin');
    });
    
    document.getElementById('signUpBtn').addEventListener('click', () => {
      authModal.show('signup');
    });
    
    document.getElementById('continueLocalBtn').addEventListener('click', () => {
      this.startFreeTier();
    });
  }
  
  async displayUserInfo() {
    const { user } = await authService.getUser();
    if (user) {
      // You can add user email display in settings or header if needed
      this.userEmail = user.email;
    }
  }
  
  removeBookmarkLimit() {
    // Remove any existing limit warnings
    const limitWarning = document.querySelector('.limit-warning');
    if (limitWarning) {
      limitWarning.remove();
    }
  }
}

// Initialize the popup
new SmartBookmarksPopup();