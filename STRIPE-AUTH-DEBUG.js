/**
 * 🚨 STRIPE AUTHENTICATION DEBUG SCRIPT
 * Run this in the extension console to test Stripe auth flow
 */

console.log('🔍 STRIPE AUTHENTICATION DEBUG\n');

// Test 1: Check if user is authenticated
chrome.storage.local.get(['supabase_access_token'], (result) => {
  if (result.supabase_access_token) {
    console.log('✅ User is authenticated with Supabase');
    console.log('   Token exists:', !!result.supabase_access_token);
  } else {
    console.error('❌ User is NOT authenticated');
    console.log('   SOLUTION: User needs to sign in first');
  }
});

// Test 2: Check Stripe configuration
console.log('\n📊 STRIPE CONFIGURATION:');
if (typeof STRIPE_CONFIG !== 'undefined') {
  console.log('✅ Stripe config found:', STRIPE_CONFIG);
} else {
  console.log('⚠️ STRIPE_CONFIG not in global scope');
}

// Test 3: Test authentication flow
console.log('\n🧪 TESTING AUTHENTICATION FLOW:');
console.log('1. Click "Upgrade to Pro" button');
console.log('2. If not signed in → Sign in modal should appear');
console.log('3. After sign in → Stripe checkout should open');

// Test 4: Manual Stripe checkout test
console.log('\n🔧 MANUAL CHECKOUT TEST:');
console.log('Run this to test checkout directly:');
console.log(`
chrome.runtime.sendMessage({
  action: 'createCheckoutSession',
  priceId: 'price_1Qe8XMBNfbMXDCuzKI7NJYxV',
  source: 'debug_test'
}, (response) => {
  console.log('Checkout response:', response);
});
`);

// Test 5: Quick fix for development
console.log('\n💡 QUICK DEVELOPMENT FIX:');
console.log('To bypass auth temporarily, modify openStripeCheckout to show:');
console.log('alert("Pro upgrade coming soon! Email support@smartbookmarks.com");');

console.log('\n✅ DEBUG COMPLETE');
console.log('The authentication error is expected if user is not signed in.');
console.log('The flow now handles this gracefully by prompting sign in.');