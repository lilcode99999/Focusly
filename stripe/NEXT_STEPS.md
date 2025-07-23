# Stripe Integration - Next Steps

## Current Status ✅
- Database schema ready with subscription fields
- Stripe setup scripts created
- Webhook handler (Edge Function) created
- Client utilities for Chrome extension created
- Test scripts ready

## Required Actions 🔄

### 1. Get Stripe API Keys
1. Sign up at https://stripe.com (if needed)
2. Go to https://dashboard.stripe.com/test/apikeys
3. Copy your test keys:
   - **Publishable key**: `pk_test_...`
   - **Secret key**: `sk_test_...`
4. Add to `/mcp-server/.env`:
   ```
   STRIPE_SECRET_KEY=sk_test_your_key_here
   STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
   ```

### 2. Install Dependencies & Create Products
```bash
# Install Stripe dependencies
npm install

# Create products in Stripe
npm run stripe:setup
```

This will create:
- Smart Bookmarks Pro ($9.99/month)
- Smart Bookmarks Teams ($19.99/month)
- Save price IDs to `stripe/stripe-config.json`

### 3. Deploy Webhook Handler
```bash
# Install Supabase CLI if needed
npm install -g supabase

# Link to your project
supabase link --project-ref txairbygkxuaqwfcospq

# Deploy the webhook
npm run deploy:webhook
```

### 4. Configure Stripe Webhook
1. Go to https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. Enter URL: `https://txairbygkxuaqwfcospq.supabase.co/functions/v1/stripe-webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the webhook signing secret
6. Add to `/mcp-server/.env`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   ```

### 5. Set Edge Function Environment Variables
In Supabase dashboard → Edge Functions → stripe-webhook → Settings:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRO_PRICE_ID` (from stripe-config.json)
- `STRIPE_TEAMS_PRICE_ID` (from stripe-config.json)

### 6. Test the Integration
```bash
npm run stripe:test
```

This will:
- Create a test customer
- Create a checkout session
- Verify database updates work
- Clean up test data

## Payment Flow Overview

1. **User clicks "Upgrade"** → Create checkout session
2. **Redirect to Stripe** → User enters payment info
3. **Payment success** → Webhook fires
4. **Database updated** → User becomes Pro/Teams
5. **Extension checks** → Pro features unlocked

## Testing Payment Flow

Use test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

## Common Issues & Solutions

**Webhook not firing**
- Check URL is exact (including /v1/)
- Verify signing secret matches
- Check Edge Function logs

**Database not updating**
- Verify service role key in Edge Function
- Check user email matches
- Review webhook handler logic

**Products not found**
- Run `npm run stripe:setup`
- Check stripe-config.json exists
- Verify API keys are correct

## Success Criteria ✅
- [ ] Stripe products created
- [ ] Webhook endpoint deployed
- [ ] Can create checkout sessions
- [ ] Webhook updates database
- [ ] User subscription tier changes
- [ ] Pro features unlock in extension

Once all steps are complete, we'll move to Phase 1C: Authentication System!