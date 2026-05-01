const disabledBillingError = new Error(
  'Stripe billing is disabled for the local-first MVP.'
);

export const getStripe = async () => null;

export const SUBSCRIPTION_TIERS = {
  FREE: 'free',
  PRO: 'pro',
  TEAMS: 'teams',
  ENTERPRISE: 'enterprise',
} as const;

export type SubscriptionTier =
  typeof SUBSCRIPTION_TIERS[keyof typeof SUBSCRIPTION_TIERS];

export const PRICE_IDS = {
  PRO: '',
  TEAMS: '',
};

export const createCheckoutSession = async (
  _tier: 'pro' | 'teams',
  _email: string,
  _userId: string
) => {
  throw disabledBillingError;
};

export const redirectToCheckout = async (_sessionId: string) => {
  throw disabledBillingError;
};

export const hasActiveSubscription = async (_userId: string): Promise<boolean> => {
  return false;
};

export const getSubscriptionDetails = async (_userId: string) => {
  return {
    tier: SUBSCRIPTION_TIERS.FREE as SubscriptionTier,
    status: 'disabled',
    expiresAt: null,
    isActive: false,
    isPro: false,
  };
};

export const cancelSubscription = async (_userId: string) => {
  throw disabledBillingError;
};

export const updateSubscription = async (
  _userId: string,
  _newTier: 'pro' | 'teams'
) => {
  throw disabledBillingError;
};
