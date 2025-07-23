#!/bin/bash

echo "🚀 Deploying Stripe webhook handler to Supabase Edge Functions..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found!"
    echo "Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Check if we're linked to a project
if ! supabase status &> /dev/null; then
    echo "❌ Not linked to a Supabase project!"
    echo "Please run: supabase link --project-ref txairbygkxuaqwfcospq"
    exit 1
fi

echo "📦 Deploying stripe-webhook function..."

# Deploy the function
supabase functions deploy stripe-webhook \
  --no-verify-jwt

if [ $? -eq 0 ]; then
    echo "✅ Function deployed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Set environment variables in Supabase dashboard:"
    echo "   - STRIPE_SECRET_KEY"
    echo "   - STRIPE_WEBHOOK_SECRET"
    echo "   - STRIPE_PRO_PRICE_ID (from stripe-config.json)"
    echo "   - STRIPE_TEAMS_PRICE_ID (from stripe-config.json)"
    echo ""
    echo "2. Your webhook endpoint URL is:"
    echo "   https://txairbygkxuaqwfcospq.supabase.co/functions/v1/stripe-webhook"
    echo ""
    echo "3. Add this URL to Stripe webhook settings"
else
    echo "❌ Deployment failed!"
    exit 1
fi