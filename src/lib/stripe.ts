import { Stripe } from 'stripe';
import { logger } from './logger';

// Ensure environment variables are loaded
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  logger.error('STRIPE_SECRET_KEY is not set in environment variables');
}

// Initialize Stripe only on the server side
let stripe: Stripe | null = null;
if (typeof window === 'undefined' && stripeSecretKey) {
  stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2024-12-18.acacia',
    typescript: true,
  });
}

interface BasePlan {
  name: string;
  price: number;
  features: string[];
}

interface PaidPlan extends BasePlan {
  url: string;
}

interface SubscriptionPlans {
  FREE: BasePlan;
  PINKU: PaidPlan;
  VIP: PaidPlan;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlans = {
  FREE: {
    name: 'Free',
    price: 0,
    features: [
      'Basic Beauty Risk Assessment',
      'Community Access',
      'Limited Posts',
    ]
  },
  PINKU: {
    name: 'Pink U',
    price: 30,
    url: 'https://buy.stripe.com/7sI16Vgvf2RW4QUbIR',
    features: [
      'Smart Mirror Analysis',
      'Beauty Risk Assessment',
      'Discounted Pink Facials',
      'Virtual Skin Consultations',
      'Basic Treatment Plans',
      'PinkLife Rewards'
    ]
  },
  VIP: {
    name: 'Pink VIP',
    price: 155,
    url: 'https://buy.stripe.com/fZeeXLdj3akoeru28g',
    features: [
      'All Pink U Features',
      'Exclusive Pink Facials',
      'Priority Consultations',
      'Premium Treatment Plans',
      'VIP PinkLife Rewards',
      'Access to Andi (Virtual Esthetician)',
      'Exclusive Events & Previews'
    ]
  }
};

export type SubscriptionTier = keyof typeof SUBSCRIPTION_PLANS;

export function getSubscriptionUrl(tier: SubscriptionTier): string {
  const plan = SUBSCRIPTION_PLANS[tier];
  if ('url' in plan) {
    return plan.url;
  }
  throw new Error(`No URL available for tier: ${tier}`);
}

export function getSubscriptionFeatures(tier: SubscriptionTier): string[] {
  return SUBSCRIPTION_PLANS[tier].features;
}

export function getSubscriptionPrice(tier: SubscriptionTier): number {
  return SUBSCRIPTION_PLANS[tier].price;
}

export function getSubscriptionName(tier: SubscriptionTier): string {
  return SUBSCRIPTION_PLANS[tier].name;
}

export async function handleSubscriptionChange(subscriptionId: string): Promise<{
  customerId: string;
  status: string;
  tier: SubscriptionTier;
}> {
  if (!stripe) {
    throw new Error('Stripe is not initialized');
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return {
      customerId: subscription.customer as string,
      status: subscription.status,
      tier: subscription.metadata.tier as SubscriptionTier,
    };
  } catch (error) {
    logger.error('Error handling subscription change:', error as Error);
    throw error;
  }
}

export async function cancelSubscription(subscriptionId: string): Promise<void> {
  if (!stripe) {
    throw new Error('Stripe is not initialized');
  }

  try {
    await stripe.subscriptions.cancel(subscriptionId);
  } catch (error) {
    logger.error('Error canceling subscription:', error as Error);
    throw error;
  }
}

export async function getCustomerPortalUrl(customerId: string): Promise<string> {
  if (!stripe) {
    throw new Error('Stripe is not initialized');
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXTAUTH_URL}/profile`,
    });
    return session.url;
  } catch (error) {
    logger.error('Error getting customer portal URL:', error as Error);
    throw error;
  }
}

export default stripe; 