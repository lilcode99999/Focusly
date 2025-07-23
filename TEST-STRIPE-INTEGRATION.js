/**
 * 🧪 Test Stripe Payment Integration
 * Run this in the extension console to verify payment flow
 */

console.log('🧪 TESTING STRIPE PAYMENT INTEGRATION\n');

// Test 1: Check if payment link is configured
console.log('1️⃣ Checking payment link configuration...');
const codeContent = window.smartBookmarksApp.openStripeCheckout.toString();
const hasPlaceholder = codeContent.includes('REPLACE_WITH_ACTUAL_LINK');
const paymentLinkMatch = codeContent.match(/https:\/\/buy\.stripe\.com\/[^\s'"]+/);

if (hasPlaceholder) {
  console.error('❌ Payment link NOT configured!');
  console.log('   ACTION: Replace placeholder URL in popup-prod.js line 3990');
  console.log('   See STRIPE-PAYMENT-LINK-SETUP.md for instructions');
} else if (paymentLinkMatch) {
  console.log('✅ Payment link found:', paymentLinkMatch[0]);
  console.log('   Ready for production!');
} else {
  console.warn('⚠️ Could not detect payment link');
}

// Test 2: Simulate upgrade flow
console.log('\n2️⃣ Testing upgrade flow...');
console.log('Click "Website Blocking" card to test the full flow');

// Test 3: Check modal functionality
console.log('\n3️⃣ Testing modal functions...');
if (typeof window.smartBookmarksApp.showProModal === 'function') {
  console.log('✅ showProModal function exists');
} else {
  console.error('❌ showProModal function missing');
}

if (typeof window.smartBookmarksApp.hideProModal === 'function') {
  console.log('✅ hideProModal function exists');
} else {
  console.error('❌ hideProModal function missing');
}

// Test 4: Manual trigger test
console.log('\n4️⃣ Manual test commands:');
console.log('To open Pro modal:');
console.log('  window.smartBookmarksApp.showProModal()');
console.log('\nTo trigger payment:');
console.log('  window.smartBookmarksApp.openStripeCheckout()');

// Test 5: Check Pro status
console.log('\n5️⃣ Checking Pro status...');
chrome.storage.local.get(['isPro'], (result) => {
  if (result.isPro) {
    console.log('✅ User has Pro status');
  } else {
    console.log('⏳ User does not have Pro status yet');
  }
});

console.log('\n✅ TESTING COMPLETE');
console.log('Follow the setup guide in STRIPE-PAYMENT-LINK-SETUP.md to enable payments!');