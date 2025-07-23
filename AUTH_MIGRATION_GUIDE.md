# Authentication Migration Guide

This guide explains how to update popup.js to use real Supabase authentication instead of fake auth.

## Key Changes Required

### 1. Replace Fake Pro Status Checks

**Find and replace throughout popup.js:**

```javascript
// OLD - Fake Pro check
const { isPro } = await chrome.storage.sync.get(['isPro']);

// NEW - Real subscription check
const subscription = await authService.checkSubscriptionStatus();
const isPro = subscription.isPro;
```

### 2. Update checkProStatus() Function

**Replace at line ~1003:**

```javascript
// OLD
async checkProStatus() {
  const { isPro } = await chrome.storage.sync.get(['isPro']);
  this.isPro = isPro || false;
  if (this.isPro) {
    this.removeBookmarkLimit();
    this.showProFeatures();
  }
}

// NEW
async checkProStatus() {
  try {
    const subscription = await authService.checkSubscriptionStatus();
    this.isPro = subscription.isPro;
    this.subscriptionTier = subscription.tier;
    
    if (this.isPro) {
      this.removeBookmarkLimit();
      this.showProFeatures();
    }
  } catch (error) {
    console.error('Error checking pro status:', error);
    this.isPro = false;
  }
}
```

### 3. Update Upgrade Modal Calls

**Replace all instances of:**

```javascript
// OLD
window.upgradeModal = new UpgradeModal();
upgradeModal.open();

// NEW
upgradeModalReal.open();
```

### 4. Update addUpgradePrompts() Function

**Replace at line ~1019:**

```javascript
// OLD
upgradeBtn.addEventListener('click', () => {
  upgradeModal.open();
});

// NEW
upgradeBtn.addEventListener('click', () => {
  upgradeModalReal.open();
});
```

### 5. Add Auth State Listener

**Add to init() function:**

```javascript
// Listen for auth state changes
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'AUTH_STATE_CHANGED') {
    // Refresh pro status and UI
    this.checkProStatus();
    this.loadBookmarks();
  }
});
```

### 6. Update User Display

**Add user info display:**

```javascript
// In init() or after auth check
async displayUserInfo() {
  const { user } = await authService.getUser();
  if (user) {
    // Show user email in settings or header
    const userElement = document.getElementById('userEmail');
    if (userElement) {
      userElement.textContent = user.email;
    }
  }
}
```

### 7. Handle Unauthenticated State

**Add auth check on startup:**

```javascript
// In init()
const isAuthenticated = await authService.isAuthenticated();
if (!isAuthenticated) {
  // Show sign-in prompt
  this.showAuthPrompt();
} else {
  // Load normal UI
  this.loadBookmarks();
  this.checkProStatus();
}

showAuthPrompt() {
  const container = document.getElementById('bookmarksContainer');
  container.innerHTML = `
    <div class="auth-prompt">
      <h3>Sign in to Smart Bookmarks</h3>
      <p>Create an account or sign in to sync your bookmarks and access Pro features.</p>
      <button class="auth-btn" id="signInBtn">Sign In</button>
      <button class="auth-btn secondary" id="signUpBtn">Create Account</button>
    </div>
  `;
  
  document.getElementById('signInBtn').addEventListener('click', () => {
    authModal.show('signin');
  });
  
  document.getElementById('signUpBtn').addEventListener('click', () => {
    authModal.show('signup');
  });
}
```

### 8. Update Bookmark Limit Check

**Replace checkBookmarkLimit() at line ~1044:**

```javascript
// NEW - Check both auth and subscription
async checkBookmarkLimit() {
  const isAuthenticated = await authService.isAuthenticated();
  if (!isAuthenticated) {
    // Show auth prompt instead of upgrade
    authModal.show('signin');
    return false;
  }
  
  const subscription = await authService.checkSubscriptionStatus();
  if (!subscription.isPro && this.bookmarks.length >= 100) {
    this.showBookmarkLimitMessage();
    // Open upgrade modal
    upgradeModalReal.open();
    return false;
  }
  
  return true;
}
```

## Testing Checklist

- [ ] User can sign up with email/password
- [ ] User can sign in with existing account
- [ ] Auth state persists across extension restarts
- [ ] Pro status correctly reflects Stripe subscription
- [ ] Upgrade modal opens Stripe checkout
- [ ] Pro features unlock after successful payment
- [ ] Sign out clears all auth state
- [ ] Bookmark limit enforced for free users
- [ ] Auth modal shows when unauthenticated

## Environment Variables

Make sure these are set in config.js:
- SUPABASE_URL
- SUPABASE_ANON_KEY
- STRIPE_PUBLISHABLE_KEY
- Price IDs for Pro and Teams

## Next Steps

1. Update popup.js with these changes
2. Test auth flow end-to-end
3. Deploy webhook functions to Supabase
4. Test payment flow with Stripe test cards
5. Update background.js to sync auth state