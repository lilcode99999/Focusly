class SmartBookmarksOptions {
  constructor() {
    this.settings = {
      theme: 'system',
      compactMode: false,
      defaultSearchMode: 'semantic',
      autoCategorizeBM: false,
      smartRecommendations: false,
      enableTimeTracking: false,
      idleDetection: 60,
      productivityNotifications: false,
      timerDuration: 25,
      timerNotifications: true,
      timeBasedBlocking: false,
      workHoursMode: false,
      emergencyOverride: true,
      timeBlindnessSupport: true,
      reducedClutterMode: false,
      gentleNotifications: true,
      transitionHelper: false,
      highContrastMode: false,
      largerText: false,
      reducedMotion: false,
      analytics: true,
      cloudSync: false,
      backgroundProcessing: true,
      cacheSize: 'medium'
    };
    
    this.blockedSites = ['youtube.com', 'reddit.com'];
    this.currentTab = 'general';
    
    this.init();
  }
  
  async init() {
    await this.loadSettings();
    this.setupTabNavigation();
    this.setupSettingsControls();
    this.setupTheme();
    this.renderBlockedSites();
    await this.checkProStatus();
    this.loadFocusAnalytics();
    this.loadAccountStatus();
  }
  
  async loadSettings() {
    try {
      const stored = await chrome.storage.sync.get(['settings', 'blockedSites']);
      if (stored.settings) {
        this.settings = { ...this.settings, ...stored.settings };
      }
      if (stored.blockedSites) {
        this.blockedSites = stored.blockedSites;
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }
  
  async saveSettings() {
    try {
      await chrome.storage.sync.set({
        settings: this.settings,
        blockedSites: this.blockedSites
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }
  
  setupTabNavigation() {
    const tabs = document.querySelectorAll('.nav-tab');
    const contents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetTab = tab.dataset.tab;
        
        // Update active tab
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Update active content
        contents.forEach(c => c.classList.remove('active'));
        document.getElementById(targetTab).classList.add('active');
        
        this.currentTab = targetTab;
      });
    });
  }
  
  setupSettingsControls() {
    // Theme selector
    const themeSelect = document.getElementById('themeSelect');
    themeSelect.value = this.settings.theme;
    themeSelect.addEventListener('change', (e) => {
      this.settings.theme = e.target.value;
      this.applyTheme();
      this.saveSettings();
    });
    
    // Toggle switches
    this.setupToggle('compactMode');
    this.setupToggle('autoCategorizeBM');
    this.setupToggle('smartRecommendations');
    this.setupToggle('enableTimeTracking');
    this.setupToggle('productivityNotifications');
    this.setupToggle('timerNotifications');
    this.setupToggle('timeBasedBlocking');
    this.setupToggle('workHoursMode');
    this.setupToggle('emergencyOverride');
    this.setupToggle('timeBlindnessSupport');
    this.setupToggle('reducedClutterMode');
    this.setupToggle('gentleNotifications');
    this.setupToggle('transitionHelper');
    this.setupToggle('highContrastMode');
    this.setupToggle('largerText');
    this.setupToggle('reducedMotion');
    this.setupToggle('analytics');
    this.setupToggle('cloudSync');
    this.setupToggle('backgroundProcessing');
    
    // Select dropdowns
    this.setupSelect('defaultSearchMode');
    this.setupSelect('idleDetection');
    this.setupSelect('timerDuration');
    this.setupSelect('cacheSize');
    
    // Blocked sites management
    this.setupBlockedSitesManagement();
    
    // Action buttons
    this.setupActionButtons();
  }
  
  setupToggle(settingId) {
    const toggle = document.getElementById(settingId);
    if (!toggle) return;
    
    // Set initial state
    if (this.settings[settingId]) {
      toggle.classList.add('active');
    }
    
    toggle.addEventListener('click', () => {
      const isActive = toggle.classList.contains('active');
      this.settings[settingId] = !isActive;
      
      if (this.settings[settingId]) {
        toggle.classList.add('active');
      } else {
        toggle.classList.remove('active');
      }
      
      this.saveSettings();
      this.handleSettingChange(settingId, this.settings[settingId]);
    });
  }
  
  setupSelect(settingId) {
    const select = document.getElementById(settingId);
    if (!select) return;
    
    select.value = this.settings[settingId];
    select.addEventListener('change', (e) => {
      this.settings[settingId] = e.target.value;
      this.saveSettings();
      this.handleSettingChange(settingId, this.settings[settingId]);
    });
  }
  
  setupBlockedSitesManagement() {
    const addSiteBtn = document.getElementById('addSiteBtn');
    const newSiteInput = document.getElementById('newSiteInput');
    
    addSiteBtn.addEventListener('click', () => {
      this.addBlockedSite();
    });
    
    newSiteInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.addBlockedSite();
      }
    });
  }
  
  setupActionButtons() {
    // Upgrade button
    const upgradeBtn = document.getElementById('upgradeToProBtn');
    upgradeBtn.addEventListener('click', () => {
      this.showUpgradeModal();
    });
    
    // Export data button
    const exportBtn = document.getElementById('exportDataBtn');
    exportBtn.addEventListener('click', () => {
      this.exportUserData();
    });
    
    // Reset settings button
    const resetBtn = document.getElementById('resetSettingsBtn');
    resetBtn.addEventListener('click', () => {
      this.resetAllSettings();
    });
    
    // View analytics button
    const analyticsBtn = document.getElementById('viewAnalyticsBtn');
    analyticsBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('analytics.html') });
    });
  }
  
  setupTheme() {
    this.applyTheme();
  }
  
  applyTheme() {
    const theme = this.settings.theme;
    const body = document.body;
    
    // Remove existing theme classes
    body.removeAttribute('data-theme');
    
    if (theme === 'dark') {
      body.setAttribute('data-theme', 'dark');
    } else if (theme === 'light') {
      body.setAttribute('data-theme', 'light');
    }
    // System theme is handled by CSS media queries
  }
  
  renderBlockedSites() {
    const container = document.getElementById('blockedSitesList');
    
    container.innerHTML = this.blockedSites.map(site => `
      <div class="blocked-site-item">
        <div>
          <span class="blocked-site-url">${this.escapeHtml(site)}</span>
          <span class="blocked-site-time">(blocked during focus)</span>
        </div>
        <button class="remove-site-btn" data-site="${this.escapeHtml(site)}" title="Remove site">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
          </svg>
        </button>
      </div>
    `).join('');
    
    // Add event listeners for remove buttons
    container.querySelectorAll('.remove-site-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const site = e.currentTarget.dataset.site;
        this.removeBlockedSite(site);
      });
    });
  }
  
  addBlockedSite() {
    const input = document.getElementById('newSiteInput');
    const site = input.value.trim().toLowerCase();
    
    if (!site) return;
    
    // Clean up the URL
    const cleanSite = site.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    
    if (!this.blockedSites.includes(cleanSite)) {
      this.blockedSites.push(cleanSite);
      this.saveSettings();
      this.renderBlockedSites();
      input.value = '';
      
      // Show success feedback
      this.showNotification('Site added to blocked list', 'success');
    } else {
      this.showNotification('Site is already blocked', 'warning');
    }
  }
  
  removeBlockedSite(site) {
    const index = this.blockedSites.indexOf(site);
    if (index > -1) {
      this.blockedSites.splice(index, 1);
      this.saveSettings();
      this.renderBlockedSites();
      this.showNotification('Site removed from blocked list', 'success');
    }
  }
  
  handleSettingChange(settingId, value) {
    switch (settingId) {
      case 'reducedMotion':
        if (value) {
          document.documentElement.style.setProperty('--transition-fast', 'none');
          document.documentElement.style.setProperty('--transition-medium', 'none');
        } else {
          document.documentElement.style.removeProperty('--transition-fast');
          document.documentElement.style.removeProperty('--transition-medium');
        }
        break;
        
      case 'highContrastMode':
        if (value) {
          document.body.style.filter = 'contrast(1.2)';
        } else {
          document.body.style.filter = '';
        }
        break;
        
      case 'largerText':
        if (value) {
          document.documentElement.style.fontSize = '16px';
        } else {
          document.documentElement.style.fontSize = '';
        }
        break;
    }
    
    // Send message to background script about setting change
    chrome.runtime.sendMessage({
      action: 'settingChanged',
      setting: settingId,
      value: value
    });
  }
  
  async checkProStatus() {
    // Check if user has Pro tier
    try {
      const { isPro } = await chrome.storage.sync.get(['isPro']);
      
      // Get all Pro feature toggles
      const proFeatureIds = [
        'autoCategorizeBM',
        'smartRecommendations', 
        'enableTimeTracking',
        'productivityNotifications',
        'timeBasedBlocking',
        'workHoursMode',
        'cloudSync'
      ];
      
      // Enable/disable Pro features based on status
      proFeatureIds.forEach(id => {
        const toggle = document.getElementById(id);
        const settingItem = toggle?.closest('.setting-item');
        
        if (settingItem) {
          if (isPro) {
            settingItem.classList.remove('disabled');
            toggle.disabled = false;
          } else {
            settingItem.classList.add('disabled');
            toggle.disabled = true;
            // Add click handler to show upgrade modal
            settingItem.addEventListener('click', (e) => {
              if (!isPro && e.target.closest('.setting-item').classList.contains('disabled')) {
                this.showUpgradeModal();
              }
            });
          }
        }
      });
      
      // Hide upgrade sections if Pro
      if (isPro) {
        const upgradeSection = document.querySelector('.upgrade-section');
        if (upgradeSection) {
          upgradeSection.style.display = 'none';
        }
      }
    } catch (error) {
      console.error('Failed to check Pro status:', error);
    }
  }
  
  async loadAccountStatus() {
    const accountStatusEl = document.getElementById('accountStatus');
    if (!accountStatusEl) return;
    
    try {
      const { isPro, userEmail } = await chrome.storage.sync.get(['isPro', 'userEmail']);
      
      accountStatusEl.innerHTML = `
        <div class="account-info">
          <div class="account-detail">
            <label>Email:</label>
            <span>${userEmail || 'Not signed in'}</span>
          </div>
          <div class="account-detail">
            <label>Subscription:</label>
            <span class="${isPro ? 'pro-status' : 'free-status'}">
              ${isPro ? 'Pro ($9.99/month)' : 'Free Plan'}
            </span>
          </div>
          ${isPro ? `
            <div class="account-actions">
              <button class="btn-secondary" onclick="window.open('https://billing.stripe.com/p/login/test_00g000000000000', '_blank')">
                Manage Subscription
              </button>
            </div>
          ` : `
            <div class="account-actions">
              <button class="btn-primary" id="accountUpgradeBtn">
                Upgrade to Pro - $9.99/month
              </button>
            </div>
          `}
        </div>
      `;
      
      // Add upgrade button handler if free user
      if (!isPro) {
        const upgradeBtn = document.getElementById('accountUpgradeBtn');
        if (upgradeBtn) {
          upgradeBtn.addEventListener('click', () => {
            this.showUpgradeModal();
          });
        }
      }
    } catch (error) {
      console.error('Failed to load account status:', error);
      accountStatusEl.innerHTML = '<p class="error">Failed to load account information</p>';
    }
  }
  
  showUpgradeModal() {
    // Check if modal already exists
    let modal = document.querySelector('.upgrade-modal');
    if (modal) {
      modal.remove(); // Remove existing modal first
    }
    
    // Create upgrade modal
    modal = document.createElement('div');
    modal.className = 'upgrade-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h2>Upgrade to Smart Bookmarks Pro</h2>
        <div class="tier-options" style="grid-template-columns: 1fr;">
          <div class="tier-option featured" style="max-width: 400px; margin: 0 auto;">
            <div class="tier-option-content">
              <h3>Pro Tier</h3>
              <div class="price">$9.99/month</div>
              <ul>
                <li>Unlimited bookmarks (no 100 limit)</li>
                <li>AI-powered semantic search</li>
                <li>Smart categorization</li>
                <li>Advanced time tracking</li>
                <li>Analytics dashboard</li>
                <li>Site blocking & productivity tools</li>
                <li>Cloud sync (coming soon)</li>
                <li>Priority support</li>
              </ul>
            </div>
            <button class="tier-btn primary" data-tier="pro">Upgrade to Pro</button>
          </div>
        </div>
        <button class="modal-close">&times;</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add fade-in animation
    requestAnimationFrame(() => {
      modal.classList.add('show');
    });
    
    // Handle modal interactions
    modal.querySelector('.modal-close').addEventListener('click', () => {
      modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
    
    // Handle tier selection
    modal.querySelectorAll('.tier-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const tier = e.target.getAttribute('data-tier');
        modal.remove();
        
        // Create checkout session with real Stripe
        try {
          // Load scripts if not already loaded
          if (!window.authService) {
            const script = document.createElement('script');
            script.src = chrome.runtime.getURL('auth-service.js');
            document.head.appendChild(script);
            await new Promise(resolve => script.onload = resolve);
          }
          
          // Initialize auth service if needed
          await authService.initialize();
          
          // Check if user is authenticated
          const { user } = await authService.getUser();
          if (!user) {
            // Show auth modal first
            const authModalScript = document.createElement('script');
            authModalScript.src = chrome.runtime.getURL('auth-modal.js');
            document.head.appendChild(authModalScript);
            await new Promise(resolve => authModalScript.onload = resolve);
            
            authModal.show('signin');
            return;
          }
          
          // Create checkout session
          const result = await authService.createCheckoutSession(tier);
          if (result.success) {
            chrome.tabs.create({ url: result.checkoutUrl });
          }
        } catch (error) {
          console.error('Upgrade error:', error);
          // Fallback to upgrade modal
          window.location.href = chrome.runtime.getURL('popup.html');
        }
      });
    });
  }
  
  async exportUserData() {
    try {
      const data = await chrome.storage.local.get(null);
      const exportData = {
        bookmarks: data.bookmarks || [],
        analytics: data.analytics || [],
        settings: this.settings,
        blockedSites: this.blockedSites,
        exportDate: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `smart-bookmarks-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      
      URL.revokeObjectURL(url);
      this.showNotification('Data exported successfully', 'success');
    } catch (error) {
      console.error('Export failed:', error);
      this.showNotification('Export failed. Please try again.', 'error');
    }
  }
  
  resetAllSettings() {
    if (confirm('Are you sure you want to reset all settings to default? This cannot be undone.')) {
      // Reset to default settings
      this.settings = {
        theme: 'system',
        compactMode: false,
        defaultSearchMode: 'semantic',
        autoCategorizeBM: false,
        smartRecommendations: false,
        enableTimeTracking: false,
        idleDetection: 60,
        productivityNotifications: false,
        timerDuration: 25,
        timerNotifications: true,
        timeBasedBlocking: false,
        workHoursMode: false,
        emergencyOverride: true,
        timeBlindnessSupport: true,
        reducedClutterMode: false,
        gentleNotifications: true,
        transitionHelper: false,
        highContrastMode: false,
        largerText: false,
        reducedMotion: false,
        analytics: true,
        cloudSync: false,
        backgroundProcessing: true,
        cacheSize: 'medium'
      };
      
      this.blockedSites = ['youtube.com', 'reddit.com'];
      
      this.saveSettings();
      location.reload(); // Reload to apply all changes
    }
  }
  
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add notification styles
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      background: var(--accent-color);
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      z-index: 1000;
      transform: translateX(100%);
      transition: transform 0.3s ease-out;
    `;
    
    if (type === 'error') {
      notification.style.background = 'var(--error-color)';
    } else if (type === 'warning') {
      notification.style.background = 'var(--warning-color)';
    } else if (type === 'success') {
      notification.style.background = 'var(--success-color)';
    }
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
  
  async loadFocusAnalytics() {
    const dashboardContainer = document.getElementById('analyticsDashboard');
    
    try {
      // Get analytics data from background script
      const response = await chrome.runtime.sendMessage({ action: 'getFocusAnalytics' });
      const analytics = response.analytics;
      
      if (!analytics || analytics.sessions.length === 0) {
        this.renderEmptyAnalytics(dashboardContainer);
        return;
      }
      
      this.renderAnalytics(dashboardContainer, analytics);
    } catch (error) {
      console.error('Failed to load focus analytics:', error);
      this.renderErrorAnalytics(dashboardContainer);
    }
  }
  
  renderEmptyAnalytics(container) {
    container.innerHTML = `
      <div class="empty-analytics">
        <div class="empty-analytics-title">Start Your Focus Journey</div>
        <div class="empty-analytics-subtitle">Complete your first focus session to see analytics and insights here</div>
        <button class="start-focus-btn" onclick="chrome.action.openPopup()">Start Focus Session</button>
      </div>
    `;
  }
  
  renderErrorAnalytics(container) {
    container.innerHTML = `
      <div class="empty-analytics">
        <div class="empty-analytics-title">Analytics Unavailable</div>
        <div class="empty-analytics-subtitle">Unable to load analytics data. Please try again later.</div>
      </div>
    `;
  }
  
  renderAnalytics(container, analytics) {
    const { weeklyStats, preferences, insights } = analytics;
    
    // Format time display
    const formatTime = (minutes) => {
      if (minutes < 60) return `${minutes}m`;
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    };
    
    container.innerHTML = `
      <div class="analytics-stats">
        <div class="stat-card">
          <div class="stat-value">${formatTime(weeklyStats.totalFocusTime)}</div>
          <div class="stat-label">This Week's Focus Time</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-value">${weeklyStats.averageSession}min</div>
          <div class="stat-label">Average Session Length</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-value">${weeklyStats.completionRate}%</div>
          <div class="stat-label">Session Completion Rate</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-value">${preferences.optimalDuration}min</div>
          <div class="stat-label">Your Optimal Duration</div>
        </div>
      </div>
      
      ${insights.length > 0 ? `
        <div class="insights-section">
          <div class="insights-title">🧠 Personal Insights</div>
          ${insights.map(insight => `
            <div class="insight-card ${insight.type}">
              <div class="insight-icon">${insight.icon}</div>
              <div class="insight-content">
                <div class="insight-title">${insight.title}</div>
                <div class="insight-message">${insight.message}</div>
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}
    `;
  }
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new SmartBookmarksOptions();
});