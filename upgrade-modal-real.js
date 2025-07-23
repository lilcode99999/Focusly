// Real Upgrade Modal with Supabase Auth and Stripe Integration
class UpgradeModalReal {
  constructor() {
    this.isOpen = false;
    this.modalElement = null;
    this.authService = authService; // Use global authService
    this.userEmail = null;
    this.isProcessing = false;
  }

  async open() {
    if (this.isOpen) return;
    
    this.isOpen = true;
    
    // Check if user is authenticated
    const { user } = await this.authService.getUser();
    
    if (!user) {
      // Show auth modal first
      authModal.show('signin');
      
      // Listen for successful auth
      const authListener = (message) => {
        if (message.type === 'AUTH_STATE_CHANGED' && message.isAuthenticated) {
          chrome.runtime.onMessage.removeListener(authListener);
          // Reopen upgrade modal after auth
          setTimeout(() => this.open(), 500);
        }
      };
      chrome.runtime.onMessage.addListener(authListener);
      return;
    }

    this.userEmail = user.email;
    
    // Check current subscription status
    const subscription = await this.authService.checkSubscriptionStatus();
    if (subscription.isPro) {
      // Already pro, show management options
      this.showSubscriptionManagement(subscription);
      return;
    }

    this.render();
    this.attachListeners();
    this.trackView();
  }

  render() {
    this.modalElement = document.createElement('div');
    this.modalElement.className = 'upgrade-modal-backdrop';
    this.modalElement.innerHTML = `
      <div class="upgrade-modal">
        <button class="modal-close" aria-label="Close modal">&times;</button>
        
        <div class="modal-content">
          <div class="modal-header">
            <div class="modal-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4A90E2" stroke-width="2">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
              </svg>
            </div>
            <h2>Unlock Smart Bookmarks Pro</h2>
            <p>Join thousands of users who save hours every week with Pro features</p>
          </div>

          <div class="pricing-options">
            <div class="pricing-card recommended" data-tier="pro">
              <div class="recommended-badge">Most Popular</div>
              <h3>Pro</h3>
              <div class="price">
                <span class="currency">$</span>
                <span class="amount">9</span>
                <span class="period">.99/month</span>
              </div>
              <ul class="features">
                <li><svg class="check-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>Unlimited bookmarks</li>
                <li><svg class="check-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>AI semantic search</li>
                <li><svg class="check-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>Unlimited body doubling</li>
                <li><svg class="check-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>All integrations</li>
                <li><svg class="check-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>Priority support</li>
              </ul>
              <button class="select-plan-btn" data-tier="pro">
                <span class="btn-text">Get Pro</span>
                <span class="btn-loader" style="display: none;">
                  <svg class="spinner" viewBox="0 0 50 50">
                    <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
                  </svg>
                </span>
              </button>
            </div>

            <div class="pricing-card" data-tier="teams">
              <h3>Teams</h3>
              <div class="price">
                <span class="currency">$</span>
                <span class="amount">19</span>
                <span class="period">.99/month</span>
              </div>
              <ul class="features">
                <li><svg class="check-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>Everything in Pro</li>
                <li><svg class="check-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>5 team members</li>
                <li><svg class="check-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>Private sessions</li>
                <li><svg class="check-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>Team analytics</li>
                <li><svg class="check-icon" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>Admin controls</li>
              </ul>
              <button class="select-plan-btn secondary" data-tier="teams">
                <span class="btn-text">Get Teams</span>
                <span class="btn-loader" style="display: none;">
                  <svg class="spinner" viewBox="0 0 50 50">
                    <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
                  </svg>
                </span>
              </button>
            </div>
          </div>

          <div class="upgrade-benefits">
            <h4>What you'll get immediately:</h4>
            <div class="benefit-grid">
              <div class="benefit">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
                <span>Remove 100 bookmark limit</span>
              </div>
              <div class="benefit">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
                <span>AI-powered search</span>
              </div>
              <div class="benefit">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
                <span>Body doubling sessions</span>
              </div>
              <div class="benefit">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
                <span>Calendar integration</span>
              </div>
            </div>
          </div>

          <div class="payment-security">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34C759" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span>Secure payment via Stripe • Cancel anytime</span>
          </div>

          <div class="error-message" id="upgradeError" style="display: none;"></div>
        </div>
      </div>
    `;

    document.body.appendChild(this.modalElement);
  }

  attachListeners() {
    // Close button
    this.modalElement.querySelector('.modal-close').addEventListener('click', () => this.close());
    
    // Backdrop click
    this.modalElement.addEventListener('click', (e) => {
      if (e.target === this.modalElement) {
        this.close();
      }
    });

    // Plan selection buttons
    this.modalElement.querySelectorAll('.select-plan-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tier = e.currentTarget.dataset.tier;
        this.handlePlanSelection(tier);
      });
    });

    // ESC key
    this.escHandler = (e) => {
      if (e.key === 'Escape') this.close();
    };
    document.addEventListener('keydown', this.escHandler);
  }

  async handlePlanSelection(tier) {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    const btn = this.modalElement.querySelector(`.select-plan-btn[data-tier="${tier}"]`);
    const btnText = btn.querySelector('.btn-text');
    const btnLoader = btn.querySelector('.btn-loader');
    const errorDiv = this.modalElement.querySelector('#upgradeError');

    // Show loading state
    btn.disabled = true;
    btnText.style.display = 'none';
    btnLoader.style.display = 'block';
    errorDiv.style.display = 'none';

    try {
      // Create checkout session
      const result = await this.authService.createCheckoutSession(tier);
      
      if (result.success) {
        // Track event
        this.trackEvent('checkout_started', { tier });
        
        // Open Stripe checkout in new tab
        chrome.tabs.create({ url: result.checkoutUrl });
        
        // Close modal
        this.close();
        
        // Show message
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icon-128.png',
          title: 'Complete Your Upgrade',
          message: 'Please complete your payment in the new tab to activate Pro features.'
        });
      } else {
        throw new Error(result.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      errorDiv.textContent = error.message || 'Something went wrong. Please try again.';
      errorDiv.style.display = 'block';
    } finally {
      // Reset button state
      btn.disabled = false;
      btnText.style.display = 'block';
      btnLoader.style.display = 'none';
      this.isProcessing = false;
    }
  }

  showSubscriptionManagement(subscription) {
    this.modalElement = document.createElement('div');
    this.modalElement.className = 'upgrade-modal-backdrop';
    this.modalElement.innerHTML = `
      <div class="upgrade-modal subscription-management">
        <button class="modal-close" aria-label="Close modal">&times;</button>
        
        <div class="modal-content">
          <div class="modal-header">
            <div class="modal-icon pro">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#34C759" stroke-width="2">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
              </svg>
            </div>
            <h2>You're a Pro!</h2>
            <p>Thank you for supporting Smart Bookmarks</p>
          </div>

          <div class="subscription-details">
            <div class="detail-row">
              <span class="label">Plan:</span>
              <span class="value">${subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)}</span>
            </div>
            <div class="detail-row">
              <span class="label">Status:</span>
              <span class="value status-${subscription.status}">${subscription.status}</span>
            </div>
            ${subscription.expiresAt ? `
              <div class="detail-row">
                <span class="label">Next billing:</span>
                <span class="value">${new Date(subscription.expiresAt).toLocaleDateString()}</span>
              </div>
            ` : ''}
            <div class="detail-row">
              <span class="label">Email:</span>
              <span class="value">${this.userEmail}</span>
            </div>
          </div>

          <div class="subscription-actions">
            <button class="manage-btn" id="manageSubscription">
              Manage Subscription
            </button>
            ${subscription.tier === 'pro' ? `
              <button class="upgrade-btn" id="upgradeToTeams">
                Upgrade to Teams
              </button>
            ` : ''}
          </div>

          <div class="pro-features-active">
            <h4>Your Pro features:</h4>
            <ul>
              <li>✓ Unlimited bookmarks</li>
              <li>✓ AI semantic search</li>
              <li>✓ Unlimited body doubling sessions</li>
              <li>✓ All integrations active</li>
              <li>✓ Priority support</li>
            </ul>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(this.modalElement);

    // Attach listeners
    this.modalElement.querySelector('.modal-close').addEventListener('click', () => this.close());
    
    const manageBtn = this.modalElement.querySelector('#manageSubscription');
    if (manageBtn) {
      manageBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: 'https://billing.stripe.com/p/login/test_00g000000000000' });
        this.close();
      });
    }

    const upgradeBtn = this.modalElement.querySelector('#upgradeToTeams');
    if (upgradeBtn) {
      upgradeBtn.addEventListener('click', () => {
        this.close();
        setTimeout(() => {
          this.isOpen = false;
          this.modalElement = null;
          this.open(); // Reopen to show upgrade options
        }, 300);
      });
    }
  }

  close() {
    if (!this.isOpen) return;
    
    this.isOpen = false;
    this.modalElement.classList.add('closing');
    
    setTimeout(() => {
      this.modalElement.remove();
      this.modalElement = null;
    }, 300);

    if (this.escHandler) {
      document.removeEventListener('keydown', this.escHandler);
    }

    this.trackEvent('modal_closed');
  }

  trackView() {
    this.trackEvent('modal_viewed');
  }

  trackEvent(eventName, properties = {}) {
    chrome.runtime.sendMessage({
      action: 'trackEvent',
      event: {
        name: eventName,
        category: 'upgrade_flow',
        properties: {
          ...properties,
          timestamp: Date.now()
        }
      }
    });
  }
}

// Add styles
const upgradeModalStyles = document.createElement('style');
upgradeModalStyles.textContent = `
.upgrade-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.2s ease-out;
}

.upgrade-modal {
  background: white;
  border-radius: 16px;
  max-width: 680px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s ease-out;
  position: relative;
}

.modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s;
}

.modal-close:hover {
  background: #f5f5f5;
  color: #333;
}

.modal-content {
  padding: 48px 32px 32px;
}

.modal-header {
  text-align: center;
  margin-bottom: 32px;
}

.modal-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: #E8F2FF;
  border-radius: 50%;
  margin-bottom: 16px;
}

.modal-icon.pro {
  background: #E8F8EC;
}

.modal-header h2 {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 600;
  color: #1a1a1a;
}

.modal-header p {
  margin: 0;
  color: #666;
  font-size: 16px;
}

.pricing-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}

.pricing-card {
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 24px;
  position: relative;
  transition: all 0.2s;
}

.pricing-card.recommended {
  border-color: #4A90E2;
  transform: scale(1.05);
}

.pricing-card:hover {
  border-color: #4A90E2;
  box-shadow: 0 8px 20px rgba(74, 144, 226, 0.1);
}

.recommended-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: #4A90E2;
  color: white;
  padding: 4px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.pricing-card h3 {
  margin: 0 0 16px 0;
  font-size: 20px;
  font-weight: 600;
}

.price {
  display: flex;
  align-items: baseline;
  margin-bottom: 20px;
}

.currency {
  font-size: 20px;
  color: #666;
  margin-right: 2px;
}

.amount {
  font-size: 36px;
  font-weight: 600;
  color: #1a1a1a;
}

.period {
  font-size: 16px;
  color: #666;
  margin-left: 4px;
}

.features {
  list-style: none;
  padding: 0;
  margin: 0 0 20px 0;
}

.features li {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  color: #444;
  font-size: 14px;
}

.check-icon {
  width: 16px;
  height: 16px;
  color: #34C759;
  margin-right: 8px;
  flex-shrink: 0;
}

.select-plan-btn {
  width: 100%;
  padding: 12px;
  background: #4A90E2;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  height: 44px;
}

.select-plan-btn.secondary {
  background: #6C757D;
}

.select-plan-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.select-plan-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.btn-loader {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.spinner {
  animation: rotate 2s linear infinite;
  width: 20px;
  height: 20px;
}

.spinner .path {
  stroke: white;
  stroke-linecap: round;
  animation: dash 1.5s ease-in-out infinite;
}

.upgrade-benefits {
  background: #F8F9FA;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
}

.upgrade-benefits h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
}

.benefit-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.benefit {
  display: flex;
  align-items: center;
  gap: 8px;
}

.benefit svg {
  width: 20px;
  height: 20px;
  color: #34C759;
}

.payment-security {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #666;
  font-size: 14px;
}

.error-message {
  margin-top: 16px;
  padding: 12px;
  background: #FEE;
  color: #E74C3C;
  border-radius: 8px;
  text-align: center;
  font-size: 14px;
}

/* Subscription management styles */
.subscription-management .modal-content {
  max-width: 480px;
  margin: 0 auto;
}

.subscription-details {
  background: #F8F9FA;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 14px;
}

.detail-row:last-child {
  margin-bottom: 0;
}

.detail-row .label {
  color: #666;
}

.detail-row .value {
  font-weight: 500;
  color: #1a1a1a;
}

.status-active {
  color: #34C759;
}

.status-past_due {
  color: #FF9500;
}

.status-canceled {
  color: #FF3B30;
}

.subscription-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.manage-btn, .upgrade-btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.manage-btn {
  background: #F0F0F0;
  color: #333;
}

.manage-btn:hover {
  background: #E0E0E0;
}

.upgrade-btn {
  background: #4A90E2;
  color: white;
}

.upgrade-btn:hover {
  background: #357ABD;
}

.pro-features-active {
  border-top: 1px solid #E0E0E0;
  padding-top: 24px;
}

.pro-features-active h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
}

.pro-features-active ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.pro-features-active li {
  margin-bottom: 8px;
  color: #444;
  font-size: 14px;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes rotate {
  100% { transform: rotate(360deg); }
}

@keyframes dash {
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
}

.closing {
  animation: fadeOut 0.3s ease-out;
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}
`;

if (!document.getElementById('upgradeModalRealStyles')) {
  upgradeModalStyles.id = 'upgradeModalRealStyles';
  document.head.appendChild(upgradeModalStyles);
}

// Create global instance
const upgradeModalReal = new UpgradeModalReal();