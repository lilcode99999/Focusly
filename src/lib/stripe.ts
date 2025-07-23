import { loadStripe, Stripe } from '@stripe/stripe-js'
import { supabase } from './supabase'

// Initialize Stripe
let stripePromise: Promise<Stripe | null>

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
  }
  return stripePromise
}

// Subscription tiers
export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  PRO: 'pro',
  TEAMS: 'teams',
  ENTERPRISE: 'enterprise',
} as const

export type SubscriptionTier = typeof SUBSCRIPTION_TIERS[keyof typeof SUBSCRIPTION_TIERS]

// Price IDs (will be set from stripe-config.json after setup)
export const PRICE_IDS = {
  PRO: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || '',
  TEAMS: process.env.NEXT_PUBLIC_STRIPE_TEAMS_PRICE_ID || '',
}

// Create checkout session
export const createCheckoutSession = async (
  tier: 'pro' | 'teams',
  email: string,
  userId: string
) => {
  try {
    const priceId = tier === 'pro' ? PRICE_IDS.PRO : PRICE_IDS.TEAMS
    
    if (!priceId) {
      throw new Error(`Price ID not configured for ${tier} tier`)
    }
    
    // Call your backend API to create a checkout session
    // For now, we'll use a Supabase Edge Function
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
      },
      body: JSON.stringify({
        priceId,
        email,
        userId,
        successUrl: `${window.location.origin}/subscription/success`,
        cancelUrl: `${window.location.origin}/subscription/cancel`,
      }),
    })
    
    if (!response.ok) {
      throw new Error('Failed to create checkout session')
    }
    
    const { sessionId } = await response.json()
    return sessionId
  } catch (error) {
    console.error('Error creating checkout session:', error)
    throw error
  }
}

// Redirect to Stripe Checkout
export const redirectToCheckout = async (sessionId: string) => {
  const stripe = await getStripe()
  if (!stripe) {
    throw new Error('Stripe not loaded')
  }
  
  const { error } = await stripe.redirectToCheckout({ sessionId })
  
  if (error) {
    console.error('Error redirecting to checkout:', error)
    throw error
  }
}

// Check if user has active subscription
export const hasActiveSubscription = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('subscription_tier, subscription_status')
      .eq('id', userId)
      .single()
    
    if (error) throw error
    
    return (
      data?.subscription_status === 'active' &&
      data?.subscription_tier !== 'free'
    )
  } catch (error) {
    console.error('Error checking subscription:', error)
    return false
  }
}

// Get user's subscription details
export const getSubscriptionDetails = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('subscription_tier, subscription_status, subscription_expires_at')
      .eq('id', userId)
      .single()
    
    if (error) throw error
    
    return {
      tier: data.subscription_tier as SubscriptionTier,
      status: data.subscription_status,
      expiresAt: data.subscription_expires_at ? new Date(data.subscription_expires_at) : null,
      isActive: data.subscription_status === 'active',
      isPro: data.subscription_tier === 'pro' || data.subscription_tier === 'teams' || data.subscription_tier === 'enterprise',
    }
  } catch (error) {
    console.error('Error getting subscription details:', error)
    return {
      tier: 'free' as SubscriptionTier,
      status: 'active',
      expiresAt: null,
      isActive: true,
      isPro: false,
    }
  }
}

// Cancel subscription
export const cancelSubscription = async (userId: string) => {
  try {
    // Call your backend API to cancel subscription
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/cancel-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
      },
      body: JSON.stringify({ userId }),
    })
    
    if (!response.ok) {
      throw new Error('Failed to cancel subscription')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error canceling subscription:', error)
    throw error
  }
}

// Update subscription (upgrade/downgrade)
export const updateSubscription = async (
  userId: string,
  newTier: 'pro' | 'teams'
) => {
  try {
    const priceId = newTier === 'pro' ? PRICE_IDS.PRO : PRICE_IDS.TEAMS
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/update-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
      },
      body: JSON.stringify({ userId, priceId }),
    })
    
    if (!response.ok) {
      throw new Error('Failed to update subscription')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error updating subscription:', error)
    throw error
  }
}