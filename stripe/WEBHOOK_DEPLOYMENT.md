# Webhook Deployment Instructions

## Prerequisites
- Supabase CLI installed (`npm install -g supabase`)
- Logged in to Supabase CLI (`supabase login`)

## Step 1: Link to Your Project

```bash
supabase link --project-ref txairbygkxuaqwfcospq
```

## Step 2: Deploy the Webhook Function

```bash
# Deploy the stripe-webhook function
supabase functions deploy stripe-webhook --no-verify-jwt

# Deploy the create-checkout-session function  
supabase functions deploy create-checkout-session
```

## Step 3: Set Environment Variables

Go to your Supabase dashboard:
1. Navigate to Edge Functions
2. Click on `stripe-webhook`
3. Go to Settings
4. Add these environment variables:

```
STRIPE_SECRET_KEY=sk_test_YOUR_TEST_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=(you'll get this from Stripe dashboard)
```

## Step 4: Configure Stripe Webhook

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. Enter endpoint URL:
   ```
   https://YOUR_SUPABASE_PROJECT_ID.supabase.co/functions/v1/stripe-webhook
   ```
4. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

5. After creating, copy the "Signing secret" (starts with `whsec_`)
6. Add it to Supabase Edge Function environment variables as `STRIPE_WEBHOOK_SECRET`

## Step 5: Test the Webhook

1. In Stripe dashboard, go to your webhook
2. Click "Send test webhook"
3. Choose `checkout.session.completed`
4. Check Supabase Edge Function logs for success

## Your Webhook URLs

- **Webhook Endpoint**: `https://YOUR_SUPABASE_PROJECT_ID.supabase.co/functions/v1/stripe-webhook`
- **Checkout Session**: `https://YOUR_SUPABASE_PROJECT_ID.supabase.co/functions/v1/create-checkout-session`

## Verify Deployment

Check function status:
```bash
supabase functions list
```

View logs:
```bash
supabase functions logs stripe-webhook
```

## Troubleshooting

**Function not found**
- Make sure you're in the project root directory
- Verify you're linked to the correct project

**Webhook signature verification failed**
- Double-check the webhook secret in Supabase matches Stripe
- Ensure you're using the correct endpoint URL

**Database updates failing**
- Check that SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set
- Verify RLS policies allow service role access