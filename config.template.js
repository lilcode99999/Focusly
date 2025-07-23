// Copy this file to config.local.js and add your actual keys
// NEVER commit config.local.js to git

// Supabase Configuration
const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// Stripe Configuration (if needed)
const STRIPE_PUBLISHABLE_KEY = 'YOUR_STRIPE_PUBLISHABLE_KEY';

// Example for development:
// const SUPABASE_URL = 'https://abc123.supabase.co';
// const SUPABASE_ANON_KEY = 'eyJ...your-actual-key-here...';
// const STRIPE_PUBLISHABLE_KEY = 'pk_test_...';

// Export for use in extension
if (typeof window !== 'undefined') {
  window.SUPABASE_URL = SUPABASE_URL;
  window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
  window.STRIPE_PUBLISHABLE_KEY = STRIPE_PUBLISHABLE_KEY;
}