"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CheckIcon } from 'lucide-react';
import { SUBSCRIPTION_PLANS, SubscriptionTier, getSubscriptionUrl } from '@/lib/stripe';
import { getStripe } from '@/lib/stripe-client';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';
import { toast } from 'react-hot-toast';

interface MembershipDialogProps {
  children?: React.ReactNode;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  currentTier?: SubscriptionTier;
}

export default function MembershipDialog({ 
  children, 
  defaultOpen = false,
  onOpenChange,
  currentTier = 'FREE',
}: MembershipDialogProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubscribe = async (tier: SubscriptionTier) => {
    try {
      setIsLoading(true);

      // Don't process if trying to subscribe to FREE tier
      if (tier === 'FREE') {
        toast.error('Cannot subscribe to free tier');
        return;
      }

      // Initialize Stripe
      const stripe = await getStripe();
      if (!stripe) {
        throw new Error('Failed to initialize Stripe');
      }

      // Get subscription URL
      const url = getSubscriptionUrl(tier);
      if (!url) {
        throw new Error('No subscription URL available for this tier');
      }

      // Redirect to checkout
      window.location.href = url;
    } catch (error) {
      logger.error('Error initiating subscription:', error as Error);
      toast.error('Failed to start subscription process. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    onOpenChange?.(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Choose Your Membership</DialogTitle>
          <DialogDescription>
            Select a plan that best fits your beauty journey
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 md:grid-cols-2 lg:gap-8 mt-4">
          {Object.entries(SUBSCRIPTION_PLANS)
            .filter(([key]) => key !== 'FREE') // Don't show FREE tier in the dialog
            .map(([key, plan]) => {
              const tier = key as SubscriptionTier;
              const isCurrentTier = currentTier === tier;
              
              return (
                <Card key={key} className={isCurrentTier ? 'border-pink-500' : ''}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {plan.name}
                      {isCurrentTier && (
                        <span className="text-sm text-pink-500 font-normal">
                          Current Plan
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription>
                      ${plan.price}/month
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckIcon className="h-5 w-5 text-pink-500 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      onClick={() => handleSubscribe(tier)}
                      disabled={isLoading || isCurrentTier}
                    >
                      {isCurrentTier ? 'Current Plan' : 'Subscribe'}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
        </div>
      </DialogContent>
    </Dialog>
  );
} 