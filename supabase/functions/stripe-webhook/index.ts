import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import Stripe from 'https://esm.sh/stripe@13.10.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  try {
    // Verify webhook signature
    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      return new Response('No signature', { status: 400 })
    }

    const body = await req.text()
    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message)
      return new Response(`Webhook Error: ${err.message}`, { status: 400 })
    }

    console.log('Processing webhook event:', event.type)

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdate(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaymentSucceeded(invoice)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaymentFailed(invoice)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('Handling checkout.session.completed:', session.id)
  
  if (!session.customer || !session.subscription) {
    console.error('Missing customer or subscription in session')
    return
  }

  const customerId = typeof session.customer === 'string' ? session.customer : session.customer.id
  const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id
  
  // Get the subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const tier = getTierFromPriceId(subscription.items.data[0].price.id)
  
  // Update user profile
  const { error } = await supabase
    .from('user_profiles')
    .update({
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      subscription_tier: tier,
      subscription_status: 'active',
      subscription_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('email', session.customer_email)
  
  if (error) {
    console.error('Error updating user profile:', error)
    throw error
  }
  
  console.log(`User ${session.customer_email} upgraded to ${tier}`)
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  console.log('Handling subscription update:', subscription.id)
  
  const tier = getTierFromPriceId(subscription.items.data[0].price.id)
  const status = mapStripeStatus(subscription.status)
  
  const { error } = await supabase
    .from('user_profiles')
    .update({
      subscription_tier: tier,
      subscription_status: status,
      subscription_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)
  
  if (error) {
    console.error('Error updating subscription:', error)
    throw error
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Handling subscription deletion:', subscription.id)
  
  const { error } = await supabase
    .from('user_profiles')
    .update({
      subscription_tier: 'free',
      subscription_status: 'canceled',
      subscription_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)
  
  if (error) {
    console.error('Error canceling subscription:', error)
    throw error
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Handling successful payment for invoice:', invoice.id)
  
  if (!invoice.subscription) return
  
  const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription.id
  
  const { error } = await supabase
    .from('user_profiles')
    .update({
      subscription_status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscriptionId)
  
  if (error) {
    console.error('Error updating payment status:', error)
    throw error
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Handling failed payment for invoice:', invoice.id)
  
  if (!invoice.subscription) return
  
  const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription.id
  
  const { error } = await supabase
    .from('user_profiles')
    .update({
      subscription_status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscriptionId)
  
  if (error) {
    console.error('Error updating payment status:', error)
    throw error
  }
}

function getTierFromPriceId(priceId: string): 'pro' | 'teams' | 'free' {
  // Price IDs from stripe-config.json
  const PRICE_IDS = {
    pro: 'price_1RjALzGb2rFMogEtnnQrb24r',
    teams: 'price_1RjAM0Gb2rFMogEtqGhozSCg',
  }
  
  // Also check environment variables as fallback
  const envPriceIds = {
    pro: Deno.env.get('STRIPE_PRO_PRICE_ID') || PRICE_IDS.pro,
    teams: Deno.env.get('STRIPE_TEAMS_PRICE_ID') || PRICE_IDS.teams,
  }
  
  if (priceId === envPriceIds.pro || priceId === PRICE_IDS.pro) return 'pro'
  if (priceId === envPriceIds.teams || priceId === PRICE_IDS.teams) return 'teams'
  
  // Default to pro if unknown
  return 'pro'
}

function mapStripeStatus(stripeStatus: Stripe.Subscription.Status): string {
  const statusMap: Record<Stripe.Subscription.Status, string> = {
    'active': 'active',
    'past_due': 'past_due',
    'unpaid': 'past_due',
    'canceled': 'canceled',
    'incomplete': 'trialing',
    'incomplete_expired': 'canceled',
    'trialing': 'trialing',
    'paused': 'paused',
  }
  
  return statusMap[stripeStatus] || 'canceled'
}