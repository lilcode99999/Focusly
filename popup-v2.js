/**
 * Smart Bookmarks v2.0 - Future-Ready Productivity OS
 * Scalable architecture for neurodivergent productivity platform
 */

class ProductivityOS {
  constructor() {
    // Core system components
    this.searchEngine = new UniversalSearchEngine();
    this.tabRouter = new AdaptiveTabRouter();
    this.widgetSystem = new ComponentWidgetSystem();
    this.dataLayer = new ScalableDataLayer();
    this.contextEngine = new UserContextEngine();
    this.mcpIntegration = new MCPIntegrationLayer();
    
    // App state
    this.currentTab = 'hub';
    this.currentContext = 'all';
    this.userTier = 'free';
    this.energyLevel = 'medium';
    this.cognitiveLoad = 'optimal';
    this.enabledFeatures = new Set(['bookmarks', 'focus', 'settings']);
    
    // Settings
    this.settings = {
      theme: 'system'
    };
    
    // ADHD support
    this.adhdSettings = {
      reducedCognitiveLoad: true,
      gentleNotifications: true,
      timeBlindnessSupport: true,
      energyAwareSuggestions: true
    };
    
    this.init();
  }

  async init() {
    try {
      console.log('🚀 Initializing Productivity OS v2.0');
      
      // Load user context and preferences
      await this.contextEngine.loadUserContext();
      await this.loadUserSettings();
      
      // Initialize core systems
      await this.dataLayer.initialize();
      this.searchEngine.initialize(this.dataLayer);
      this.tabRouter.initialize(this.enabledFeatures);
      this.widgetSystem.initialize();
      
      // Set up UI event listeners
      this.setupUniversalSearch();
      this.setupTabNavigation();
      this.setupQuickActions();
      this.setupEnergyMonitoring();
      this.setupCognitiveLoadManagement();
      
      // Initialize widgets
      this.initializeWidgets();
      
      // Set up auto-refresh
      this.startAutoRefresh();
      
      console.log('✅ Productivity OS initialized successfully');
      
      // Show initialization success to user
      setTimeout(() => {
        this.showNotification('🧠 ADHD Productivity OS ready!', 'success');
      }, 500);
      
    } catch (error) {
      console.error('❌ Failed to initialize Productivity OS:', error);
      this.showFallbackUI();
    }
  }

  showFallbackUI() {
    // Show a simple fallback UI if main initialization fails
    document.body.innerHTML = `
      <div style="padding: 20px; text-align: center; font-family: system-ui;">
        <h3>Smart Bookmarks</h3>
        <p>Loading...</p>
        <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; border: none; background: #007aff; color: white; border-radius: 6px; cursor: pointer;">
          Retry
        </button>
      </div>
    `;
  }

  async loadUserSettings() {
    try {
      const stored = await chrome.storage.local.get([
        'userTier', 'hasSeenWelcome', 'energyLevel', 'adhdSettings', 'enabledFeatures', 'settings'
      ]);
      
      this.userTier = stored.userTier || 'free';
      this.energyLevel = stored.energyLevel || 'medium';
      this.adhdSettings = { ...this.adhdSettings, ...stored.adhdSettings };
      this.settings = { ...this.settings, ...stored.settings };
      
      if (stored.enabledFeatures) {
        this.enabledFeatures = new Set(stored.enabledFeatures);
      }
      
      // Check if this is first time use
      if (!stored.hasSeenWelcome) {
        await this.showADHDWelcome();
      }
      
      // Update UI based on settings
      this.updateEnergyIndicator();
      this.applyCognitiveLoadSettings();
      
    } catch (error) {
      console.error('Failed to load user settings:', error);
    }
  }

  async showADHDWelcome() {
    // Mark as seen and save initial settings
    await chrome.storage.local.set({
      hasSeenWelcome: true,
      userTier: 'free',
      adhdSettings: this.adhdSettings
    });

    // Show ADHD-focused welcome
    setTimeout(() => {
      this.showNotification(
        '🧠 Welcome! This extension is designed with ADHD in mind. Click the brain icon to adjust cognitive load settings.',
        'info'
      );
    }, 1000);
  }

  setupUniversalSearch() {
    const searchInput = document.getElementById('universalSearch');
    const contextFilters = document.getElementById('contextFilters');
    
    let debounceTimer;
    
    // Universal search with debouncing
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        this.handleUniversalSearch(e.target.value);
      }, 300);
    });
    
    // Context filter switching
    contextFilters.addEventListener('click', (e) => {
      if (e.target.classList.contains('context-filter') && !e.target.classList.contains('disabled')) {
        this.switchContext(e.target.dataset.context);
      }
    });
    
    // Enhanced search with keyboard shortcuts
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Tab' && e.shiftKey) {
        e.preventDefault();
        this.cycleContextFilters(-1);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        this.cycleContextFilters(1);
      } else if (e.key === 'Escape') {
        e.target.blur();
        this.clearSearch();
      }
    });
  }

  async handleUniversalSearch(query) {
    if (!query.trim()) {
      this.showRecentItems();
      return;
    }

    // Show loading state
    this.showSearchLoading();

    try {
      // Use the search engine with current context
      const results = await this.searchEngine.search(query, this.currentContext);
      this.displaySearchResults(results, query);
      
      // Track search for ADHD insights
      this.contextEngine.recordSearchPattern(query, this.currentContext);
      
    } catch (error) {
      console.error('Search failed:', error);
      this.showSearchError();
    }
  }

  switchContext(context) {
    // Update active context filter
    document.querySelectorAll('.context-filter').forEach(filter => {
      filter.classList.toggle('active', filter.dataset.context === context);
    });
    
    this.currentContext = context;
    
    // Re-run search if there's a query
    const searchInput = document.getElementById('universalSearch');
    if (searchInput.value.trim()) {
      this.handleUniversalSearch(searchInput.value);
    } else {
      this.showRecentItems();
    }
    
    // Update placeholder based on context
    this.updateSearchPlaceholder(context);
  }

  updateSearchPlaceholder(context) {
    const searchInput = document.getElementById('universalSearch');
    const placeholders = {
      all: 'Search everything...',
      bookmarks: 'Search bookmarks...',
      notes: 'Search notes...',
      calendar: 'Search calendar...',
      tasks: 'Search tasks...',
      voice: 'Search voice notes...'
    };
    
    searchInput.placeholder = placeholders[context] || 'Search...';
  }

  setupTabNavigation() {
    const tabNavigation = document.getElementById('tabNavigation');
    
    tabNavigation.addEventListener('click', (e) => {
      const tab = e.target.closest('.nav-tab');
      if (tab) {
        this.switchTab(tab.dataset.tab);
      }
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.metaKey || e.ctrlKey) {
        const tabKeys = { '1': 'hub', '2': 'focus', '3': 'settings' };
        if (tabKeys[e.key]) {
          e.preventDefault();
          this.switchTab(tabKeys[e.key]);
        }
      }
    });
  }

  switchTab(tabId) {
    // Update navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabId);
    });
    
    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `${tabId}Tab`);
    });
    
    this.currentTab = tabId;
    
    // Initialize tab-specific features
    this.initializeTabFeatures(tabId);
    
    // Track navigation for ADHD insights
    this.contextEngine.recordTabUsage(tabId);
  }

  initializeTabFeatures(tabId) {
    switch(tabId) {
      case 'hub':
        this.refreshHubWidgets();
        break;
      case 'focus':
        this.initializeFocusTimer();
        break;
      case 'settings':
        this.loadSettingsState();
        break;
    }
  }

  setupQuickActions() {
    // Save bookmark action
    document.getElementById('saveBookmarkAction')?.addEventListener('click', () => {
      this.saveCurrentPage();
    });
    
    // Start focus action
    document.getElementById('startFocusAction')?.addEventListener('click', () => {
      this.switchTab('focus');
      setTimeout(() => this.startFocusSession(), 100);
    });
    
    // Capture note action (future feature)
    document.getElementById('captureNoteAction')?.addEventListener('click', () => {
      this.showComingSoonNotification('Note capture');
    });
  }

  async saveCurrentPage() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
        this.showNotification('Cannot bookmark this page', 'warning');
        return;
      }

      const bookmark = {
        title: tab.title || 'Untitled',
        url: tab.url,
        description: '',
        dateAdded: Date.now(),
        source: 'manual'
      };

      const success = await this.dataLayer.saveBookmark(bookmark);
      
      if (success) {
        this.showNotification('📌 Bookmark saved!', 'success');
        this.refreshHubWidgets();
        this.updateStats();
      } else {
        this.showNotification('Failed to save bookmark', 'error');
      }

    } catch (error) {
      console.error('Failed to save bookmark:', error);
      this.showNotification('Failed to save bookmark', 'error');
    }
  }

  setupEnergyMonitoring() {
    const energyIndicator = document.getElementById('energyIndicator');
    
    // Energy level detection based on usage patterns
    this.contextEngine.onEnergyLevelChange((level) => {
      this.energyLevel = level;
      this.updateEnergyIndicator();
      this.adaptUIToEnergyLevel(level);
    });
    
    // Click to manually adjust energy level
    energyIndicator.addEventListener('click', () => {
      this.showEnergyLevelSelector();
    });
  }

  updateEnergyIndicator() {
    const indicator = document.getElementById('energyIndicator');
    if (indicator) {
      indicator.className = `energy-indicator ${this.energyLevel}`;
      indicator.title = `Energy Level: ${this.energyLevel.charAt(0).toUpperCase() + this.energyLevel.slice(1)}`;
    }
  }

  applyCognitiveLoadSettings() {
    const body = document.body;
    
    // Apply ADHD-friendly settings
    if (this.adhdSettings.reducedCognitiveLoad) {
      body.classList.add('reduced-cognitive-load');
    }
    
    if (this.adhdSettings.gentleNotifications) {
      body.classList.add('gentle-notifications');
    }
    
    if (this.adhdSettings.timeBlindnessSupport) {
      body.classList.add('time-blindness-support');
    }
  }

  showRecentItems() {
    // Show recent items instead of search results
    this.refreshRecentItems();
  }

  showSearchLoading() {
    const container = document.getElementById('recentResults');
    if (container) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
          <div style="margin-bottom: 16px;">🔍</div>
          <div>Searching...</div>
        </div>
      `;
    }
  }

  showSearchError() {
    const container = document.getElementById('recentResults');
    if (container) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--error-color);">
          <div style="margin-bottom: 16px;">❌</div>
          <div>Search failed. Please try again.</div>
        </div>
      `;
    }
  }

  clearSearch() {
    const searchInput = document.getElementById('universalSearch');
    if (searchInput) {
      searchInput.value = '';
      this.showRecentItems();
    }
  }

  cycleContextFilters(direction) {
    const filters = document.querySelectorAll('.context-filter:not(.disabled)');
    const activeFilter = document.querySelector('.context-filter.active');
    let currentIndex = Array.from(filters).indexOf(activeFilter);
    
    currentIndex += direction;
    if (currentIndex < 0) currentIndex = filters.length - 1;
    if (currentIndex >= filters.length) currentIndex = 0;
    
    const newFilter = filters[currentIndex];
    if (newFilter) {
      this.switchContext(newFilter.dataset.context);
    }
  }

  displaySearchResults(results, query) {
    const container = document.getElementById('recentResults');
    if (!container) return;

    if (results.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
          <div style="margin-bottom: 16px;">🔍</div>
          <div>No results found for "${query}"</div>
        </div>
      `;
    } else {
      container.innerHTML = results.map(item => this.renderResultItem(item)).join('');
    }
  }

  showEnergyLevelSelector() {
    // Simple energy level cycling for now
    const levels = ['high', 'medium', 'low'];
    const currentIndex = levels.indexOf(this.energyLevel);
    const nextIndex = (currentIndex + 1) % levels.length;
    
    this.energyLevel = levels[nextIndex];
    this.updateEnergyIndicator();
    this.adaptUIToEnergyLevel(this.energyLevel);
    
    this.showNotification(`Energy level: ${this.energyLevel}`, 'info');
  }

  suggestLowEnergyMode() {
    this.showNotification('Low energy detected. Consider taking a break! 💙', 'info');
  }

  showGentleCelebration() {
    // Gentle, non-overwhelming celebration for ADHD users
    const celebration = document.createElement('div');
    celebration.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--success-color);
      color: white;
      padding: 20px;
      border-radius: 12px;
      font-size: 18px;
      text-align: center;
      z-index: 2000;
      animation: gentlePulse 2s ease-out;
    `;
    celebration.textContent = '✨ Great job! ✨';
    
    document.body.appendChild(celebration);
    
    setTimeout(() => {
      celebration.remove();
    }, 2000);
  }

  loadSettingsState() {
    // Load and display current settings in the settings tab
    const themeSelect = document.getElementById('themeSelect');
    const cognitiveLoadToggle = document.getElementById('cognitiveLoadToggle');
    
    if (themeSelect) {
      themeSelect.value = this.settings?.theme || 'system';
      themeSelect.addEventListener('change', (e) => {
        this.updateTheme(e.target.value);
      });
    }
    
    if (cognitiveLoadToggle) {
      cognitiveLoadToggle.textContent = this.adhdSettings.reducedCognitiveLoad ? 'Enabled' : 'Disabled';
      cognitiveLoadToggle.classList.toggle('active', this.adhdSettings.reducedCognitiveLoad);
      
      cognitiveLoadToggle.addEventListener('click', () => {
        this.toggleReducedCognitiveLoad();
      });
    }
  }

  updateTheme(theme) {
    // Update theme setting and apply immediately
    if (this.settings) {
      this.settings.theme = theme;
      this.saveUserSettings();
    }
    
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);
  }

  toggleReducedCognitiveLoad() {
    this.adhdSettings.reducedCognitiveLoad = !this.adhdSettings.reducedCognitiveLoad;
    this.applyCognitiveLoadSettings();
    this.saveUserSettings();
    this.loadSettingsState(); // Refresh the UI
  }

  async saveUserSettings() {
    try {
      await chrome.storage.local.set({
        adhdSettings: this.adhdSettings,
        settings: this.settings,
        energyLevel: this.energyLevel
      });
    } catch (error) {
      console.error('Failed to save user settings:', error);
    }
  }

  startFocusSession() {
    // Start the focus timer automatically when user clicks start focus
    const startButton = document.getElementById('timerStart');
    if (startButton && startButton.textContent === 'Start Focus') {
      startButton.click();
    }
  }

  adaptUIToEnergyLevel(level) {
    const body = document.body;
    
    // Remove previous energy classes
    body.classList.remove('energy-high', 'energy-medium', 'energy-low');
    body.classList.add(`energy-${level}`);
    
    // Adapt cognitive load based on energy
    if (level === 'low' && this.adhdSettings.energyAwareSuggestions) {
      this.suggestLowEnergyMode();
    }
  }

  setupCognitiveLoadManagement() {
    const indicator = document.getElementById('cognitiveLoadIndicator');
    
    // Monitor cognitive load based on UI complexity
    this.cognitiveLoadMonitor = new CognitiveLoadMonitor();
    this.cognitiveLoadMonitor.onLoadChange((load) => {
      this.cognitiveLoad = load;
      this.updateCognitiveLoadIndicator();
    });
    
    indicator.addEventListener('click', () => {
      this.toggleReducedCognitiveLoad();
    });
  }

  updateCognitiveLoadIndicator() {
    const indicator = document.getElementById('cognitiveLoadIndicator');
    const icons = {
      optimal: '🧠',
      moderate: '🤔',
      high: '😵'
    };
    
    indicator.textContent = icons[this.cognitiveLoad] || '🧠';
    indicator.title = `Cognitive Load: ${this.cognitiveLoad.charAt(0).toUpperCase() + this.cognitiveLoad.slice(1)}`;
  }

  initializeWidgets() {
    // Hub widgets
    this.refreshHubWidgets();
    
    // Set up widget refresh buttons
    document.getElementById('refreshRecent')?.addEventListener('click', () => {
      this.refreshRecentItems();
    });
    
    // Initialize stats
    this.updateStats();
  }

  async refreshHubWidgets() {
    await this.refreshRecentItems();
    this.updateStats();
  }

  async refreshRecentItems() {
    const container = document.getElementById('recentResults');
    if (!container) return;
    
    try {
      const recentItems = await this.dataLayer.getRecentItems(10);
      
      if (recentItems.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">📁</div>
            <div class="empty-state-title">No items yet</div>
            <div class="empty-state-subtitle">Start bookmarking to see your recent items here</div>
          </div>
        `;
      } else {
        container.innerHTML = recentItems.map(item => this.renderResultItem(item)).join('');
      }
    } catch (error) {
      console.error('Failed to load recent items:', error);
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">❌</div>
          <div class="empty-state-title">Failed to load</div>
          <div class="empty-state-subtitle">Please try again</div>
        </div>
      `;
    }
  }

  renderResultItem(item) {
    const icon = this.getItemIcon(item.source || 'bookmark');
    const timeAgo = this.formatTimeAgo(item.dateAdded);
    
    return `
      <a href="${item.url}" class="result-item" target="_blank">
        <div class="result-icon">${icon}</div>
        <div class="result-content">
          <div class="result-title">${this.escapeHtml(item.title)}</div>
          <div class="result-meta">
            <span class="result-source">${item.source || 'bookmark'}</span>
            <span>•</span>
            <span>${timeAgo}</span>
          </div>
        </div>
      </a>
    `;
  }

  getItemIcon(source) {
    const icons = {
      bookmark: '🔖',
      note: '📝',
      task: '✅',
      calendar: '📅',
      voice: '🎤',
      manual: '📌'
    };
    return icons[source] || '📄';
  }

  async updateStats() {
    try {
      const stats = await this.dataLayer.getTodayStats();
      
      document.getElementById('bookmarkCount').textContent = stats.bookmarks;
      document.getElementById('focusTime').textContent = `${stats.focusMinutes}m`;
      
    } catch (error) {
      console.error('Failed to update stats:', error);
    }
  }

  initializeFocusTimer() {
    const timerDisplay = document.getElementById('timerDisplay');
    const startButton = document.getElementById('timerStart');
    const decreaseButton = document.getElementById('timerDecrease');
    const increaseButton = document.getElementById('timerIncrease');
    
    let duration = 25 * 60; // 25 minutes in seconds
    let isRunning = false;
    let interval;
    
    const updateDisplay = () => {
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };
    
    decreaseButton.addEventListener('click', () => {
      if (!isRunning) {
        duration = Math.max(300, duration - 300); // Min 5 minutes
        updateDisplay();
      }
    });
    
    increaseButton.addEventListener('click', () => {
      if (!isRunning) {
        duration = Math.min(3600, duration + 300); // Max 60 minutes
        updateDisplay();
      }
    });
    
    startButton.addEventListener('click', () => {
      if (!isRunning) {
        isRunning = true;
        startButton.textContent = 'Stop Focus';
        interval = setInterval(() => {
          duration--;
          updateDisplay();
          
          if (duration <= 0) {
            this.completeFocusSession();
            isRunning = false;
            startButton.textContent = 'Start Focus';
            duration = 25 * 60;
            updateDisplay();
            clearInterval(interval);
          }
        }, 1000);
      } else {
        isRunning = false;
        startButton.textContent = 'Start Focus';
        clearInterval(interval);
      }
    });
    
    updateDisplay();
  }

  async completeFocusSession() {
    // Record focus session
    await this.dataLayer.recordFocusSession();
    
    // Show completion notification
    this.showNotification('🎉 Focus session completed!', 'success');
    
    // Update stats
    this.updateStats();
    
    // ADHD-friendly celebration
    if (this.adhdSettings.gentleNotifications) {
      this.showGentleCelebration();
    }
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--surface-bg);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: var(--space-3) var(--space-4);
      box-shadow: var(--shadow-lg);
      z-index: 1000;
      font-size: var(--text-sm);
      max-width: 300px;
      animation: slideIn 0.3s ease-out;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  showComingSoonNotification(feature) {
    this.showNotification(`${feature} coming in Phase 2! 🚀`, 'info');
  }

  startAutoRefresh() {
    // Refresh recent items every 30 seconds
    setInterval(() => {
      if (this.currentTab === 'hub') {
        this.refreshRecentItems();
      }
    }, 30000);
    
    // Update stats every minute
    setInterval(() => {
      this.updateStats();
    }, 60000);
  }

  // Utility functions
  formatTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Core Engine Classes
class UniversalSearchEngine {
  constructor() {
    this.dataLayer = null;
    this.searchHistory = [];
  }

  initialize(dataLayer) {
    this.dataLayer = dataLayer;
  }

  async search(query, context = 'all') {
    const sources = this.getSearchSources(context);
    const results = [];

    for (const source of sources) {
      try {
        const sourceResults = await this.searchSource(source, query);
        results.push(...sourceResults);
      } catch (error) {
        console.error(`Search failed for source ${source}:`, error);
      }
    }

    // Sort by relevance and recency
    return this.rankResults(results, query);
  }

  getSearchSources(context) {
    const sourceMap = {
      all: ['bookmarks'],
      bookmarks: ['bookmarks'],
      notes: ['notes'],
      calendar: ['calendar'],
      tasks: ['tasks'],
      voice: ['voice']
    };
    
    return sourceMap[context] || ['bookmarks'];
  }

  async searchSource(source, query) {
    switch (source) {
      case 'bookmarks':
        return await this.dataLayer.searchBookmarks(query);
      case 'notes':
        return []; // Future implementation
      case 'calendar':
        return []; // Future implementation
      case 'tasks':
        return []; // Future implementation
      case 'voice':
        return []; // Future implementation
      default:
        return [];
    }
  }

  rankResults(results, query) {
    // Simple ranking algorithm
    return results.sort((a, b) => {
      const aScore = this.calculateRelevanceScore(a, query);
      const bScore = this.calculateRelevanceScore(b, query);
      return bScore - aScore;
    });
  }

  calculateRelevanceScore(item, query) {
    const titleMatch = item.title.toLowerCase().includes(query.toLowerCase()) ? 100 : 0;
    const urlMatch = item.url.toLowerCase().includes(query.toLowerCase()) ? 50 : 0;
    const recencyScore = Math.max(0, 50 - (Date.now() - item.dateAdded) / 86400000); // Decay over days
    
    return titleMatch + urlMatch + recencyScore;
  }
}

class AdaptiveTabRouter {
  constructor() {
    this.enabledTabs = new Set();
    this.tabOrder = ['hub', 'focus', 'settings'];
  }

  initialize(enabledFeatures) {
    this.updateEnabledTabs(enabledFeatures);
  }

  updateEnabledTabs(features) {
    this.enabledTabs.clear();
    
    // Core tabs always enabled
    this.enabledTabs.add('hub');
    this.enabledTabs.add('settings');
    
    // Feature-dependent tabs
    if (features.has('focus')) this.enabledTabs.add('focus');
    if (features.has('time-tracking')) this.enabledTabs.add('time');
    if (features.has('body-doubling')) this.enabledTabs.add('social');
    if (features.has('tools')) this.enabledTabs.add('tools');
    
    this.updateTabVisibility();
  }

  updateTabVisibility() {
    const tabNavigation = document.getElementById('tabNavigation');
    if (!tabNavigation) return;
    
    // Future implementation: Dynamic tab rendering
    console.log('Enabled tabs:', Array.from(this.enabledTabs));
  }
}

class ComponentWidgetSystem {
  constructor() {
    this.widgets = new Map();
    this.widgetConfig = new Map();
  }

  initialize() {
    this.registerCoreWidgets();
  }

  registerCoreWidgets() {
    // Future implementation: Dynamic widget registration
    console.log('Core widgets registered');
  }

  registerWidget(id, component) {
    this.widgets.set(id, component);
  }

  renderWidget(id, container) {
    const widget = this.widgets.get(id);
    if (widget) {
      return widget.render(container);
    }
  }
}

class ScalableDataLayer {
  constructor() {
    this.sources = new Map();
    this.cache = new Map();
  }

  async initialize() {
    // Initialize local storage source
    this.sources.set('local', new LocalStorageSource());
    
    // Future: Initialize cloud sources, MCP sources, etc.
    console.log('Data layer initialized');
  }

  async saveBookmark(bookmark) {
    try {
      const source = this.sources.get('local');
      const result = await source.saveBookmark(bookmark);
      
      // Invalidate cache
      this.cache.delete('recent-bookmarks');
      this.cache.delete('today-stats');
      
      return result;
    } catch (error) {
      console.error('Failed to save bookmark:', error);
      return false;
    }
  }

  async searchBookmarks(query) {
    const source = this.sources.get('local');
    return await source.searchBookmarks(query);
  }

  async getRecentItems(limit = 10) {
    const cacheKey = `recent-items-${limit}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    const source = this.sources.get('local');
    const items = await source.getRecentBookmarks(limit);
    
    this.cache.set(cacheKey, items);
    return items;
  }

  async getTodayStats() {
    const cacheKey = 'today-stats';
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    const source = this.sources.get('local');
    const stats = await source.getTodayStats();
    
    this.cache.set(cacheKey, stats);
    return stats;
  }

  async recordFocusSession() {
    const source = this.sources.get('local');
    await source.recordFocusSession();
    
    // Invalidate stats cache
    this.cache.delete('today-stats');
  }
}

class LocalStorageSource {
  async saveBookmark(bookmark) {
    try {
      const stored = await chrome.storage.local.get(['localBookmarks', 'freeBookmarkCount']);
      const bookmarks = stored.localBookmarks || [];
      const count = stored.freeBookmarkCount || 0;
      
      // Add bookmark with local ID
      const localBookmark = {
        ...bookmark,
        id: 'local_' + Date.now(),
        source: 'local'
      };
      
      bookmarks.unshift(localBookmark);
      
      await chrome.storage.local.set({
        localBookmarks: bookmarks,
        freeBookmarkCount: count + 1
      });
      
      return true;
    } catch (error) {
      console.error('Failed to save bookmark to local storage:', error);
      return false;
    }
  }

  async searchBookmarks(query) {
    const stored = await chrome.storage.local.get(['localBookmarks']);
    const bookmarks = stored.localBookmarks || [];
    
    if (!query) return bookmarks.slice(0, 10);
    
    const lowerQuery = query.toLowerCase();
    return bookmarks.filter(bookmark => 
      bookmark.title.toLowerCase().includes(lowerQuery) ||
      bookmark.url.toLowerCase().includes(lowerQuery)
    ).slice(0, 10);
  }

  async getRecentBookmarks(limit = 10) {
    const stored = await chrome.storage.local.get(['localBookmarks']);
    const bookmarks = stored.localBookmarks || [];
    return bookmarks.slice(0, limit);
  }

  async getTodayStats() {
    const stored = await chrome.storage.local.get(['focusSessions', 'freeBookmarkCount']);
    const sessions = stored.focusSessions || [];
    const bookmarkCount = stored.freeBookmarkCount || 0;
    
    // Calculate today's focus time
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaySessions = sessions.filter(session => 
      new Date(session.date).getTime() >= today.getTime()
    );
    
    const focusMinutes = todaySessions.reduce((total, session) => 
      total + session.duration, 0
    );
    
    return {
      bookmarks: bookmarkCount,
      focusMinutes: Math.round(focusMinutes / 60)
    };
  }

  async recordFocusSession() {
    const stored = await chrome.storage.local.get(['focusSessions']);
    const sessions = stored.focusSessions || [];
    
    sessions.push({
      date: Date.now(),
      duration: 25 * 60 // 25 minutes in seconds
    });
    
    await chrome.storage.local.set({ focusSessions: sessions });
  }
}

class UserContextEngine {
  constructor() {
    this.userContext = {
      energyLevel: 'medium',
      focusPatterns: [],
      searchPatterns: [],
      lastActivity: Date.now()
    };
    
    this.energyChangeCallbacks = [];
  }

  async loadUserContext() {
    try {
      const stored = await chrome.storage.local.get(['userContext']);
      if (stored.userContext) {
        this.userContext = { ...this.userContext, ...stored.userContext };
      }
    } catch (error) {
      console.error('Failed to load user context:', error);
    }
  }

  recordSearchPattern(query, context) {
    this.userContext.searchPatterns.push({
      query,
      context,
      timestamp: Date.now()
    });
    
    this.analyzeSearchPatterns();
  }

  recordTabUsage(tabId) {
    // Track tab usage for insights
    console.log(`Tab usage: ${tabId}`);
  }

  analyzeSearchPatterns() {
    // Analyze patterns to detect energy level changes
    // This is a simplified implementation
    const recentPatterns = this.userContext.searchPatterns.slice(-10);
    
    if (recentPatterns.length >= 5) {
      const rapidSearching = recentPatterns.every((pattern, index) => {
        if (index === 0) return true;
        return pattern.timestamp - recentPatterns[index - 1].timestamp < 5000;
      });
      
      if (rapidSearching && this.userContext.energyLevel !== 'low') {
        this.updateEnergyLevel('low');
      }
    }
  }

  updateEnergyLevel(level) {
    this.userContext.energyLevel = level;
    this.energyChangeCallbacks.forEach(callback => callback(level));
  }

  onEnergyLevelChange(callback) {
    this.energyChangeCallbacks.push(callback);
  }
}

class MCPIntegrationLayer {
  constructor() {
    this.connectedTools = new Map();
    this.mcpServers = new Map();
  }

  // Future implementation for MCP protocol integration
  async connectTool(toolId, config) {
    console.log(`Connecting tool: ${toolId}`);
    // Implementation for Phase 5
  }
}

class CognitiveLoadMonitor {
  constructor() {
    this.loadLevel = 'optimal';
    this.callbacks = [];
  }

  onLoadChange(callback) {
    this.callbacks.push(callback);
  }

  // Monitor DOM complexity, search frequency, etc.
  calculateLoad() {
    // Simplified implementation
    return 'optimal';
  }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  window.productivityOS = new ProductivityOS();
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes gentlePulse {
    0% {
      transform: translate(-50%, -50%) scale(0.8);
      opacity: 0;
    }
    50% {
      transform: translate(-50%, -50%) scale(1.05);
      opacity: 1;
    }
    100% {
      transform: translate(-50%, -50%) scale(1);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);