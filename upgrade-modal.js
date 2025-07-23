class UpgradeModal {
  constructor() {
    this.upgradeModal = null;
    this.emailModal = null;
    this.successModal = null;
    this.userEmail = null;
    this.proFeatures = {
      unlimitedBookmarks: false,
      analytics: false,
      smartNotifications: false,
      advancedReports: false
    };
    this.init();
  }

  init() {
    // Load modal HTML if not already in DOM
    this.loadModalHTML();
    
    // Check if user should see upgrade prompt
    this.checkUpgradeEligibility();
  }

  async loadModalHTML() {
    try {
      // Check if modals already exist
      if (document.getElementById('upgradeModal')) {
        this.setupModalReferences();
        return;
      }

      // Load modal HTML
      const response = await fetch(chrome.runtime.getURL('upgrade-modal.html'));
      const html = await response.text();
      
      // Create container and insert HTML
      const container = document.createElement('div');
      container.innerHTML = html;
      document.body.appendChild(container);
      
      // Load modal CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = chrome.runtime.getURL('upgrade-modal.css');
      document.head.appendChild(link);
      
      this.setupModalReferences();
    } catch (error) {
      console.error('Failed to load upgrade modal:', error);
    }
  }

  setupModalReferences() {
    this.upgradeModal = document.getElementById('upgradeModal');
    this.emailModal = document.getElementById('emailModal');
    this.successModal = document.getElementById('successModal');
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Close buttons
    document.getElementById('closeUpgradeModal')?.addEventListener('click', () => {
      this.closeModal(this.upgradeModal);
      this.trackEvent('upgrade_modal_closed');
    });
    
    document.getElementById('closeEmailModal')?.addEventListener('click', () => {
      this.closeModal(this.emailModal);
      this.trackEvent('email_modal_closed');
    });
    
    // Upgrade button
    document.getElementById('upgradeToProBtn')?.addEventListener('click', () => {
      this.closeModal(this.upgradeModal);
      this.showEmailModal();
      this.trackEvent('upgrade_clicked');
    });
    
    // Continue with free button
    document.getElementById('continueWithFreeBtn')?.addEventListener('click', () => {
      this.closeModal(this.upgradeModal);
      this.trackEvent('continue_free_clicked');
      // Store decision to reduce prompt frequency
      this.storeUpgradeDecision('declined');
    });
    
    // Email form
    document.getElementById('emailForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleEmailSubmit();
    });
    
    // Success modal buttons
    document.getElementById('viewAnalyticsBtn')?.addEventListener('click', () => {
      this.closeModal(this.successModal);
      // Open analytics page
      chrome.tabs.create({ url: chrome.runtime.getURL('analytics.html') });
      this.trackEvent('analytics_opened_from_success');
    });
    
    document.getElementById('closeSuccessBtn')?.addEventListener('click', () => {
      this.closeModal(this.successModal);
      this.trackEvent('success_modal_closed');
    });
    
    // Click outside to close
    [this.upgradeModal, this.emailModal, this.successModal].forEach(modal => {
      modal?.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeModal(modal);
        }
      });
    });
  }

  async checkUpgradeEligibility() {
    try {
      const { settings, bookmarkCount, lastUpgradePrompt, isPro } = await chrome.storage.sync.get([
        'settings',
        'bookmarkCount',
        'lastUpgradePrompt',
        'isPro'
      ]);
      
      // Don't show if already Pro
      if (isPro) return;
      
      // Check triggers
      const triggers = {
        bookmarkLimit: bookmarkCount >= 90, // Near 100 limit
        timeUsage: await this.checkTimeUsage(),
        daysSinceLastPrompt: this.daysSinceLastPrompt(lastUpgradePrompt)
      };
      
      // Show modal if any trigger is met
      if (triggers.bookmarkLimit || triggers.timeUsage) {
        // Don't show too frequently
        if (triggers.daysSinceLastPrompt >= 7) {
          setTimeout(() => {
            this.showUpgradeModal();
          }, 3000); // Delay to not interrupt user flow
        }
      }
    } catch (error) {
      console.error('Failed to check upgrade eligibility:', error);
    }
  }

  async checkTimeUsage() {
    // Check if user has used timer features extensively
    const { timerAnalytics } = await chrome.storage.local.get(['timerAnalytics']);
    return timerAnalytics?.focusSessions > 10;
  }

  daysSinceLastPrompt(lastPrompt) {
    if (!lastPrompt) return Infinity;
    const days = (Date.now() - lastPrompt) / (1000 * 60 * 60 * 24);
    return days;
  }

  showUpgradeModal() {
    if (this.upgradeModal) {
      this.upgradeModal.style.display = 'flex';
      this.trackEvent('upgrade_modal_shown');
      // Store timestamp
      chrome.storage.sync.set({ lastUpgradePrompt: Date.now() });
    }
  }

  showEmailModal() {
    if (this.emailModal) {
      this.emailModal.style.display = 'flex';
      document.getElementById('userEmail')?.focus();
      this.trackEvent('email_modal_shown');
    }
  }

  showSuccessModal() {
    if (this.successModal) {
      this.successModal.style.display = 'flex';
      this.trackEvent('success_modal_shown');
    }
  }

  closeModal(modal) {
    if (modal) {
      modal.style.display = 'none';
    }
  }

  async handleEmailSubmit() {
    const emailInput = document.getElementById('userEmail');
    const emailError = document.getElementById('emailError');
    const submitButton = document.getElementById('continueToPaymentBtn');
    
    if (!emailInput || !this.validateEmail(emailInput.value)) {
      emailInput?.classList.add('error');
      if (emailError) {
        emailError.textContent = 'Please enter a valid email address';
        emailError.classList.add('show');
      }
      return;
    }
    
    // Clear errors
    emailInput.classList.remove('error');
    emailError?.classList.remove('show');
    
    // Store email
    this.userEmail = emailInput.value;
    
    // Disable button and show loading
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Processing...';
    }
    
    try {
      // In a real implementation, this would redirect to Stripe
      await this.simulatePaymentFlow();
      
      // For demo: directly show success
      this.closeModal(this.emailModal);
      await this.activateProFeatures();
      this.showSuccessModal();
      
    } catch (error) {
      console.error('Payment failed:', error);
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Continue to secure payment';
      }
      if (emailError) {
        emailError.textContent = 'Something went wrong. Please try again.';
        emailError.classList.add('show');
      }
    }
  }

  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async simulatePaymentFlow() {
    // In production, this would:
    // 1. Create Stripe checkout session
    // 2. Redirect to Stripe
    // 3. Handle webhook for completion
    
    // For demo, simulate delay
    return new Promise(resolve => setTimeout(resolve, 1500));
  }

  async activateProFeatures() {
    // Activate all Pro features
    this.proFeatures = {
      unlimitedBookmarks: true,
      analytics: true,
      smartNotifications: true,
      advancedReports: true
    };
    
    // Store Pro status
    await chrome.storage.sync.set({
      isPro: true,
      proActivatedAt: Date.now(),
      userEmail: this.userEmail,
      proFeatures: this.proFeatures
    });
    
    // Send activation message to background
    chrome.runtime.sendMessage({
      action: 'proActivated',
      email: this.userEmail,
      features: this.proFeatures
    });
    
    this.trackEvent('pro_activated', {
      email: this.userEmail,
      method: 'modal_upgrade'
    });
  }

  storeUpgradeDecision(decision) {
    chrome.storage.sync.set({
      lastUpgradeDecision: decision,
      lastUpgradeDecisionTime: Date.now()
    });
  }

  trackEvent(eventName, properties = {}) {
    // Send to analytics
    chrome.runtime.sendMessage({
      action: 'trackEvent',
      event: {
        name: eventName,
        category: 'upgrade_flow',
        properties: {
          ...properties,
          timestamp: Date.now(),
          source: 'upgrade_modal'
        }
      }
    });
  }

  // Public method to trigger upgrade flow
  triggerUpgrade(source = 'manual') {
    this.showUpgradeModal();
    this.trackEvent('upgrade_triggered', { source });
  }
}

// Initialize upgrade modal
const upgradeModal = new UpgradeModal();

// Export for use in other scripts
window.SmartBookmarksUpgrade = upgradeModal;