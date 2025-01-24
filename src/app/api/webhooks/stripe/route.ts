import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import stripe from '@/lib/stripe';
import { logger } from '@/lib/logger';
import { handleSubscriptionChange } from '@/lib/stripe';
import { withErrorHandler } from '@/lib/api-middleware';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

async function handler(request: Request) {
  const body = await request.text();
  const signature = headers().get('stripe-signature')!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );
  } catch (error) {
    logger.error('Webhook signature verification failed:', error as Error);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const { customerId, status, tier } = await handleSubscriptionChange(subscription.id);

        // Update user subscription status
        await prisma.user.update({
          where: {
            stripeCustomerId: customerId,
          },
          data: {
            subscriptionTier: status === 'active' ? tier : 'FREE',
            subscriptionStatus: status,
            subscriptionId: subscription.id,
          },
        });

        logger.info(`Subscription ${event.type}`, {
          customerId,
          subscriptionId: subscription.id,
          status,
          tier,
        });
        break;
      }

      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object;
        const user = await prisma.user.findFirst({
          where: {
            subscriptionId: subscription.id,
          },
          select: {
            email: true,
            name: true,
          },
        });

        if (user) {
          // Here you would typically send an email notification
          logger.info('Trial ending notification needed', {
            subscriptionId: subscription.id,
            userEmail: user.email,
          });
        }
        break;
      }

      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('Error processing webhook:', error as Error);
    throw error;
  }
}

export const POST = withErrorHandler(handler); 