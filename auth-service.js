// Supabase Auth Service for Chrome Extension
class AuthService {
  constructor() {
    this.supabase = null;
    this.initialized = false;
    this.initPromise = null;
  }

  async initialize() {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;
    
    this.initPromise = this._initializeSupabase();
    await this.initPromise;
    this.initialized = true;
  }
  
  async _initializeSupabase() {
    // Wait for Supabase to be available (loaded from popup.html)
    if (!window.supabase) {
      console.error('Supabase not loaded. Make sure supabase.js is included in popup.html');
      throw new Error('Supabase library not available');
    }
    
    // Create custom storage adapter for Chrome extension
    const chromeStorageAdapter = {
      getItem: async (key) => {
        const result = await chrome.storage.local.get([key]);
        return result[key] || null;
      },
      setItem: async (key, value) => {
        await chrome.storage.local.set({ [key]: value });
      },
      removeItem: async (key) => {
        await chrome.storage.local.remove([key]);
      }
    };

    // Initialize Supabase client
    this.supabase = window.supabase.createClient(
      SUPABASE_CONFIG.url,
      SUPABASE_CONFIG.anonKey,
      {
        auth: {
          storage: chromeStorageAdapter,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false
        }
      }
    );

    // Set up auth state listener
    this.supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      if (event === 'SIGNED_IN') {
        await this.onSignIn(session);
      } else if (event === 'SIGNED_OUT') {
        await this.onSignOut();
      }
    });

    // Check existing session
    const { data: { session } } = await this.supabase.auth.getSession();
    if (session) {
      await this.onSignIn(session);
    }
  }

  // Removed loadSupabaseScript - Supabase now loaded via popup.html

  async signUp(email, password) {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `chrome-extension://${chrome.runtime.id}/welcome.html`
        }
      });

      if (error) throw error;

      // Check if email confirmation is required
      if (data.user && !data.session) {
        return {
          success: true,
          requiresEmailConfirmation: true,
          user: data.user
        };
      }

      return {
        success: true,
        user: data.user,
        session: data.session
      };
    } catch (error) {
      console.error('Sign up error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async signIn(email, password) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      return {
        success: true,
        user: data.user,
        session: data.session
      };
    } catch (error) {
      console.error('Sign in error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async signOut() {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) throw error;

      await this.onSignOut();
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getUser() {
    const { data: { user }, error } = await this.supabase.auth.getUser();
    return { user, error };
  }

  async getSession() {
    await this.initialize();
    const { data: { session }, error } = await this.supabase.auth.getSession();
    return { session, error };
  }

  async getUserProfile() {
    try {
      const { user } = await this.getUser();
      if (!user) return null;

      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  async checkSubscriptionStatus() {
    try {
      const profile = await this.getUserProfile();
      if (!profile) return { isPro: false, tier: 'free' };

      const isPro = ['pro', 'teams', 'enterprise'].includes(profile.subscription_tier) &&
                    profile.subscription_status === 'active';

      return {
        isPro,
        tier: profile.subscription_tier,
        status: profile.subscription_status,
        expiresAt: profile.subscription_expires_at
      };
    } catch (error) {
      console.error('Error checking subscription:', error);
      return { isPro: false, tier: 'free' };
    }
  }

  async createCheckoutSession(tier = 'pro') {
    await this.initialize();
    try {
      const { session } = await this.getSession();
      if (!session) throw new Error('Not authenticated');

      const priceId = tier === 'pro' ? STRIPE_CONFIG.proPriceId : STRIPE_CONFIG.teamsPriceId;
      
      const response = await fetch(`${SUPABASE_CONFIG.url}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          priceId,
          successUrl: `chrome-extension://${chrome.runtime.id}/payment-success.html`,
          cancelUrl: `chrome-extension://${chrome.runtime.id}/popup.html`
        })
      });

      if (!response.ok) throw new Error('Failed to create checkout session');

      const { url } = await response.json();
      return { success: true, checkoutUrl: url };
    } catch (error) {
      console.error('Error creating checkout session:', error);
      return { success: false, error: error.message };
    }
  }

  // Event handlers
  async onSignIn(session) {
    console.log('User signed in:', session.user.email);
    
    // Update storage with auth state
    await chrome.storage.local.set({
      isAuthenticated: true,
      userEmail: session.user.email,
      userId: session.user.id
    });

    // Check subscription status
    const subscription = await this.checkSubscriptionStatus();
    await chrome.storage.local.set({
      isPro: subscription.isPro,
      subscriptionTier: subscription.tier,
      subscriptionStatus: subscription.status
    });

    // Notify other parts of the extension
    chrome.runtime.sendMessage({
      type: 'AUTH_STATE_CHANGED',
      isAuthenticated: true,
      isPro: subscription.isPro
    });
  }

  async onSignOut() {
    console.log('User signed out');
    
    // Clear auth state from storage
    await chrome.storage.local.remove([
      'isAuthenticated',
      'userEmail',
      'userId',
      'isPro',
      'subscriptionTier',
      'subscriptionStatus'
    ]);

    // Notify other parts of the extension
    chrome.runtime.sendMessage({
      type: 'AUTH_STATE_CHANGED',
      isAuthenticated: false,
      isPro: false
    });
  }

  // Helper method to check if user is authenticated
  async isAuthenticated() {
    const { session } = await this.getSession();
    return !!session;
  }

  // Helper method to require authentication
  async requireAuth() {
    const isAuth = await this.isAuthenticated();
    if (!isAuth) {
      // Show sign in modal or redirect to auth page
      chrome.runtime.sendMessage({ type: 'SHOW_AUTH_MODAL' });
      throw new Error('Authentication required');
    }
  }
}

// Create singleton instance
const authService = new AuthService();

// Initialize when DOM is ready and Supabase is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for Supabase to load
    setTimeout(() => {
      if (window.supabase) {
        authService.initialize().catch(console.error);
      }
    }, 100);
  });
} else {
  // Wait a bit for Supabase to load
  setTimeout(() => {
    if (window.supabase) {
      authService.initialize().catch(console.error);
    }
  }, 100);
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = authService;
}