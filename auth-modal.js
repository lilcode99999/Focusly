// Auth Modal for Chrome Extension
class AuthModal {
  constructor() {
    this.modal = null;
    this.mode = 'signin'; // 'signin' or 'signup'
    this.authService = authService; // Use the global authService
  }

  show(mode = 'signin') {
    this.mode = mode;
    this.createModal();
    document.body.appendChild(this.modal);
    this.attachEventListeners();
    this.modal.style.display = 'flex';
  }

  hide() {
    if (this.modal) {
      this.modal.style.display = 'none';
      this.modal.remove();
      this.modal = null;
    }
  }

  createModal() {
    this.modal = document.createElement('div');
    this.modal.className = 'auth-modal-overlay';
    this.modal.innerHTML = `
      <div class="auth-modal">
        <button class="auth-modal-close">&times;</button>
        
        <div class="auth-modal-header">
          <img src="icon.png" alt="Smart Bookmarks" class="auth-modal-logo">
          <h2>${this.mode === 'signin' ? 'Welcome Back' : 'Create Account'}</h2>
          <p>${this.mode === 'signin' 
            ? 'Sign in to access your bookmarks and Pro features' 
            : 'Join Smart Bookmarks to supercharge your productivity'}</p>
        </div>

        <form class="auth-form" id="authForm">
          <div class="form-group">
            <label for="email">Email</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              required 
              placeholder="you@example.com"
              autocomplete="email"
            >
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input 
              type="password" 
              id="password" 
              name="password" 
              required 
              placeholder="${this.mode === 'signin' ? 'Enter your password' : 'Choose a strong password'}"
              autocomplete="${this.mode === 'signin' ? 'current-password' : 'new-password'}"
              minlength="6"
            >
          </div>

          ${this.mode === 'signup' ? `
            <div class="form-group">
              <label for="confirmPassword">Confirm Password</label>
              <input 
                type="password" 
                id="confirmPassword" 
                name="confirmPassword" 
                required 
                placeholder="Confirm your password"
                autocomplete="new-password"
                minlength="6"
              >
            </div>
          ` : ''}

          <div class="auth-error" id="authError" style="display: none;"></div>
          <div class="auth-success" id="authSuccess" style="display: none;"></div>

          <button type="submit" class="auth-submit-btn" id="authSubmitBtn">
            <span class="btn-text">${this.mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
            <span class="btn-loader" style="display: none;">
              <svg class="spinner" viewBox="0 0 50 50">
                <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
              </svg>
            </span>
          </button>
        </form>

        <div class="auth-divider">
          <span>or</span>
        </div>

        <div class="auth-oauth">
          <button class="oauth-btn google-btn" data-provider="google">
            <img src="https://www.google.com/favicon.ico" alt="Google">
            Continue with Google
          </button>
        </div>

        <div class="auth-switch">
          ${this.mode === 'signin' 
            ? "Don't have an account? <a href='#' class='auth-switch-link' data-mode='signup'>Sign up</a>"
            : "Already have an account? <a href='#' class='auth-switch-link' data-mode='signin'>Sign in</a>"
          }
        </div>

        ${this.mode === 'signin' ? `
          <div class="auth-forgot">
            <a href="#" class="forgot-password-link">Forgot your password?</a>
          </div>
        ` : ''}
      </div>
    `;

    // Add styles if not already present
    if (!document.getElementById('authModalStyles')) {
      const style = document.createElement('style');
      style.id = 'authModalStyles';
      style.textContent = `
        .auth-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          animation: fadeIn 0.2s ease-out;
        }

        .auth-modal {
          background: white;
          border-radius: 16px;
          padding: 32px;
          width: 90%;
          max-width: 420px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
          animation: slideUp 0.3s ease-out;
          position: relative;
        }

        .auth-modal-close {
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

        .auth-modal-close:hover {
          background: #f5f5f5;
          color: #333;
        }

        .auth-modal-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .auth-modal-logo {
          width: 64px;
          height: 64px;
          margin-bottom: 16px;
        }

        .auth-modal-header h2 {
          margin: 0 0 8px 0;
          font-size: 24px;
          font-weight: 600;
          color: #333;
        }

        .auth-modal-header p {
          margin: 0;
          color: #666;
          font-size: 14px;
        }

        .auth-form {
          margin-bottom: 24px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-size: 14px;
          font-weight: 500;
          color: #333;
        }

        .form-group input {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.2s;
          box-sizing: border-box;
        }

        .form-group input:focus {
          outline: none;
          border-color: #4A90E2;
          box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
        }

        .auth-error, .auth-success {
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 16px;
          font-size: 14px;
          text-align: center;
        }

        .auth-error {
          background: #FEE;
          color: #E74C3C;
          border: 1px solid #FDD;
        }

        .auth-success {
          background: #EFE;
          color: #27AE60;
          border: 1px solid #DFD;
        }

        .auth-submit-btn {
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
          height: 48px;
        }

        .auth-submit-btn:hover {
          background: #357ABD;
        }

        .auth-submit-btn:disabled {
          background: #B0C4DE;
          cursor: not-allowed;
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

        .auth-divider {
          text-align: center;
          margin: 24px 0;
          position: relative;
        }

        .auth-divider span {
          background: white;
          padding: 0 16px;
          color: #999;
          font-size: 14px;
          position: relative;
        }

        .auth-divider::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background: #E0E0E0;
          z-index: -1;
        }

        .oauth-btn {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: white;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }

        .oauth-btn:hover {
          background: #f8f8f8;
          border-color: #ccc;
        }

        .oauth-btn img {
          width: 20px;
          height: 20px;
        }

        .auth-switch {
          text-align: center;
          margin-top: 24px;
          font-size: 14px;
          color: #666;
        }

        .auth-switch-link, .forgot-password-link {
          color: #4A90E2;
          text-decoration: none;
          font-weight: 500;
        }

        .auth-switch-link:hover, .forgot-password-link:hover {
          text-decoration: underline;
        }

        .auth-forgot {
          text-align: center;
          margin-top: 16px;
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
      `;
      document.head.appendChild(style);
    }
  }

  attachEventListeners() {
    // Close button
    this.modal.querySelector('.auth-modal-close').addEventListener('click', () => this.hide());

    // Close on overlay click
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.hide();
      }
    });

    // Form submission
    const form = this.modal.querySelector('#authForm');
    form.addEventListener('submit', (e) => this.handleSubmit(e));

    // Switch between signin/signup
    this.modal.querySelectorAll('.auth-switch-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const newMode = e.target.dataset.mode;
        this.hide();
        this.show(newMode);
      });
    });

    // OAuth buttons
    this.modal.querySelectorAll('.oauth-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.handleOAuth(e.currentTarget.dataset.provider));
    });

    // Forgot password
    const forgotLink = this.modal.querySelector('.forgot-password-link');
    if (forgotLink) {
      forgotLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleForgotPassword();
      });
    }
  }

  async handleSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const email = form.email.value;
    const password = form.password.value;
    const submitBtn = this.modal.querySelector('#authSubmitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');
    const errorDiv = this.modal.querySelector('#authError');
    const successDiv = this.modal.querySelector('#authSuccess');

    // Reset messages
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';

    // Validate
    if (this.mode === 'signup') {
      const confirmPassword = form.confirmPassword.value;
      if (password !== confirmPassword) {
        this.showError('Passwords do not match');
        return;
      }
    }

    // Show loading state
    submitBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoader.style.display = 'block';

    try {
      let result;
      
      if (this.mode === 'signin') {
        result = await this.authService.signIn(email, password);
      } else {
        result = await this.authService.signUp(email, password);
      }

      if (result.success) {
        if (result.requiresEmailConfirmation) {
          this.showSuccess('Check your email to confirm your account!');
          setTimeout(() => this.hide(), 3000);
        } else {
          this.showSuccess(`Welcome${this.mode === 'signin' ? ' back' : ''}!`);
          setTimeout(() => {
            this.hide();
            // Reload the extension UI
            window.location.reload();
          }, 1000);
        }
      } else {
        this.showError(result.error || 'Something went wrong');
      }
    } catch (error) {
      this.showError(error.message);
    } finally {
      // Reset button state
      submitBtn.disabled = false;
      btnText.style.display = 'block';
      btnLoader.style.display = 'none';
    }
  }

  async handleOAuth(provider) {
    try {
      // OAuth in Chrome extensions requires a different approach
      // We'll open a new tab for OAuth flow
      const redirectUrl = `${SUPABASE_CONFIG.url}/auth/v1/authorize?provider=${provider}&redirect_to=${chrome.runtime.getURL('oauth-callback.html')}`;
      chrome.tabs.create({ url: redirectUrl });
      this.hide();
    } catch (error) {
      this.showError(`Failed to sign in with ${provider}`);
    }
  }

  async handleForgotPassword() {
    const email = this.modal.querySelector('#email').value;
    
    if (!email) {
      this.showError('Please enter your email first');
      return;
    }

    try {
      const { error } = await this.authService.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `chrome-extension://${chrome.runtime.id}/reset-password.html`
      });

      if (error) throw error;

      this.showSuccess('Check your email for password reset instructions');
    } catch (error) {
      this.showError(error.message);
    }
  }

  showError(message) {
    const errorDiv = this.modal.querySelector('#authError');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
  }

  showSuccess(message) {
    const successDiv = this.modal.querySelector('#authSuccess');
    successDiv.textContent = message;
    successDiv.style.display = 'block';
  }
}

// Create global instance
const authModal = new AuthModal();