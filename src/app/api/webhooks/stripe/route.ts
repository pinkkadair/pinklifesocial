import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import stripe from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { SubscriptionTier } from '@prisma/client';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  if (!stripe) {
    logger.error('Stripe is not initialized');
    return NextResponse.json(
      { error: 'Stripe is not configured' },
      { status: 500 }
    );
  }

  if (!webhookSecret) {
    logger.error('Missing Stripe webhook secret');
    return NextResponse.json(
      { error: 'Webhook secret is not configured' },
      { status: 500 }
    );
  }

  try {
    const body = await request.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature found' },
        { status: 400 }
      );
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );

    logger.info({
      event: 'stripe_webhook_received',
      type: event.type,
      id: event.id,
    });

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        
        if (!session.customer || typeof session.customer !== 'string') {
          throw new Error('No customer ID in session');
        }

        const tier = (session.metadata?.tier || 'PINKU') as SubscriptionTier;

        // Update user subscription status
        await prisma.user.update({
          where: {
            stripeCustomerId: session.customer,
          },
          data: {
            subscriptionStatus: 'active',
            subscriptionTier: tier,
          },
        });

        logger.info({
          event: 'subscription_activated',
          customerId: session.customer,
          tier,
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        
        if (!subscription.customer || typeof subscription.customer !== 'string') {
          throw new Error('No customer ID in subscription');
        }

        // Update user subscription status
        await prisma.user.update({
          where: {
            stripeCustomerId: subscription.customer,
          },
          data: {
            subscriptionStatus: 'canceled',
            subscriptionTier: 'FREE' as SubscriptionTier,
          },
        });

        logger.info({
          event: 'subscription_canceled',
          customerId: subscription.customer,
        });
        break;
      }

      // Add other webhook events as needed
      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('Error handling Stripe webhook:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
} 