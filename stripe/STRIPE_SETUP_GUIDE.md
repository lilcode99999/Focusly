# Stripe Payment Integration Setup Guide

This guide will walk you through setting up Stripe for the Smart Bookmarks Extension subscription system.

## Phase 1B: Stripe Payment Integration

### Step 1: Create Stripe Account & Get API Keys

1. **Sign up for Stripe** (if you haven't already)
   - Go to https://stripe.com
   - Create an account
   - Complete basic business information

2. **Get your test API keys**
   - Go to https://dashboard.stripe.com/test/apikeys
   - Copy your keys:
     - **Publishable key**: `pk_test_...` (for frontend)
     - **Secret key**: `sk_test_...` (for backend)
   - Save these in your `.env` file

3. **Update your environment variables**
   Add to `/mcp-server/.env`:
   ```
   STRIPE_SECRET_KEY=sk_test_your_key_here
   STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   ```

### Step 2: Create Subscription Products

Run the setup script to create products in Stripe:
```bash
npm run stripe:setup
```

This will create:
- **Smart Bookmarks Pro**: $9.99/month
- **Smart Bookmarks Teams**: $19.99/month (for 5 users)

### Step 3: Set Up Webhook Endpoint

1. **Deploy the webhook handler** (Edge Function)
   ```bash
   npm run deploy:webhook
   ```

2. **Configure webhook in Stripe Dashboard**
   - Go to https://dashboard.stripe.com/test/webhooks
   - Click "Add endpoint"
   - Enter your endpoint URL: `https://txairbygkxuaqwfcospq.supabase.co/functions/v1/stripe-webhook`
   - Select events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`

3. **Get your webhook signing secret**
   - After creating the webhook, click on it
   - Copy the "Signing secret" (starts with `whsec_`)
   - Add it to your `.env` file as `STRIPE_WEBHOOK_SECRET`

### Step 4: Test the Integration

Run the test script to verify everything is working:
```bash
npm run stripe:test
```

This will:
1. Create a test customer
2. Create a checkout session
3. Simulate a successful payment
4. Verify the webhook updates the database

## Subscription Tiers

### Free Tier (Default)
- 100 bookmarks
- 2 body doubling sessions/week
- Basic features

### Pro Tier ($9.99/month)
- Unlimited bookmarks
- Unlimited body doubling sessions
- AI semantic search
- All integrations
- Priority support

### Teams Tier ($19.99/month)
- Everything in Pro
- 5 team members
- Private team sessions
- Admin dashboard
- Team analytics

## Payment Flow

1. **User clicks "Upgrade to Pro"**
   - Frontend creates Stripe Checkout session
   - User redirected to Stripe-hosted payment page

2. **User completes payment**
   - Stripe processes payment
   - Webhook fires to our endpoint

3. **Webhook updates database**
   - Updates user_profiles subscription_tier
   - Sets subscription_status to 'active'
   - Stores stripe_customer_id and stripe_subscription_id

4. **User redirected back**
   - Extension checks subscription status
   - Pro features unlocked immediately

## Testing Cards

Use these test card numbers:
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **Requires auth**: 4000 0025 0000 3155

Any future date for expiry, any 3 digits for CVC.

## Common Issues

**Webhook not receiving events**
- Check endpoint URL is correct
- Verify signing secret matches
- Check Supabase Edge Function logs

**Subscription not updating**
- Verify database connection in Edge Function
- Check RLS policies allow service role updates
- Review webhook event handling logic

**Payment failing**
- Ensure using test mode keys
- Check product prices are in cents (999 = $9.99)
- Verify customer email is valid