# 💰 Stripe Payment Link Setup Guide

## 🚀 Quick Setup (5 Minutes)

### Step 1: Create Stripe Payment Link

1. **Go to Stripe Dashboard**
   - Log in to [dashboard.stripe.com](https://dashboard.stripe.com)
   - Navigate to **Payment Links** in the left sidebar

2. **Create New Payment Link**
   - Click "+ New payment link"
   - Configure as follows:

   **Product Details:**
   - Product name: `Smart Bookmarks Pro`
   - Description: `Website blocking, extended sessions, advanced analytics`
   - Price: `$9.99`
   - Billing: `Monthly (recurring)`

   **Settings:**
   - ✅ Allow promotion codes
   - ✅ Collect customer addresses
   - ✅ Send email receipts

3. **Copy Your Payment Link**
   - After creation, copy the link (format: `https://buy.stripe.com/xxxxx`)

### Step 2: Update Extension Code

1. **Open `popup-prod.js`**
2. **Find line 3990**
3. **Replace the placeholder URL:**

```javascript
// Before:
const stripePaymentLink = 'https://buy.stripe.com/test_REPLACE_WITH_ACTUAL_LINK';

// After (with your real link):
const stripePaymentLink = 'https://buy.stripe.com/test_abc123xyz789';
```

### Step 3: Test the Integration

1. **Reload extension** in Chrome
2. **Click "Website Blocking"** card
3. **Click "Upgrade to Pro"** button
4. **Verify** Stripe checkout opens with correct pricing

## 🔧 Advanced Setup (Optional)

### Setting Up Webhooks for Auto-Unlock

1. **Create Webhook Endpoint**
   - In Stripe Dashboard → Developers → Webhooks
   - Add endpoint: `https://yourserver.com/webhook/stripe`
   - Select events:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.deleted`

2. **Handle Webhook Events**
   - Verify payment success
   - Store customer ID with user
   - Unlock Pro features automatically

### Success Page Redirect

1. **Configure Success URL in Payment Link**
   - Success URL: `chrome-extension://YOUR_EXTENSION_ID/success.html`
   - This shows confirmation after payment

### Testing Different Scenarios

**Test Cards:**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

## ✅ What You Get

With this simple setup:
- ✅ Professional payment flow
- ✅ Secure Stripe checkout
- ✅ Automatic subscription management
- ✅ Customer portal access
- ✅ Email receipts
- ✅ Refund handling

## 📊 Revenue Tracking

Monitor your revenue in Stripe Dashboard:
- View subscriptions
- Track MRR (Monthly Recurring Revenue)
- See customer details
- Handle refunds/cancellations

## 🚨 Important Notes

1. **Test Mode First**
   - Use test Payment Links initially
   - Switch to live mode when ready

2. **Customer Communication**
   - Set up email receipts in Stripe
   - Configure subscription emails
   - Add support email

3. **Extension Updates**
   - Plan how to check subscription status
   - Consider caching Pro status locally
   - Handle offline scenarios

## 🎯 Next Steps

1. Create your Payment Link now
2. Update the code with your link
3. Test the full payment flow
4. Go live when ready!

The entire setup takes less than 5 minutes and gives you professional payment processing!