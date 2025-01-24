import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { SUBSCRIPTION_PLANS, SubscriptionTier, getSubscriptionUrl } from "@/lib/stripe";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckIcon, Crown, Gem, Sparkles } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "PinkLife Membership",
  description: "Choose your PinkLife membership plan",
};

export default async function MembershipPage() {
  const session = await getServerSession();
  
  if (!session?.user?.email) {
    redirect("/sign-in");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Choose Your Membership</h1>
          <p className="text-muted-foreground">
            Select a plan that best fits your beauty journey
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => {
            const tier = key as SubscriptionTier;
            const Icon = tier === 'VIP' ? Crown : tier === 'PINKU' ? Gem : Sparkles;

            return (
              <Card 
                key={key} 
                className={
                  tier === 'VIP' 
                    ? 'border-pink-500 shadow-lg' 
                    : tier === 'PINKU' 
                    ? 'border-purple-500' 
                    : ''
                }
              >
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className={`rounded-full p-2 ${
                      tier === 'VIP' 
                        ? 'bg-pink-100 text-pink-500' 
                        : tier === 'PINKU' 
                        ? 'bg-purple-100 text-purple-500'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle>{plan.name}</CardTitle>
                      <CardDescription>
                        {tier === 'FREE' ? 'Basic Access' : `$${plan.price}/month`}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckIcon className={`h-5 w-5 shrink-0 ${
                          tier === 'VIP' 
                            ? 'text-pink-500' 
                            : tier === 'PINKU' 
                            ? 'text-purple-500'
                            : 'text-gray-500'
                        }`} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  {tier !== 'FREE' && (
                    <Button
                      className="w-full"
                      variant={tier === 'VIP' ? 'default' : 'outline'}
                      asChild
                    >
                      <Link href={getSubscriptionUrl(tier)}>
                        Subscribe to {plan.name}
                      </Link>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>All paid plans include a 7-day free trial. Cancel anytime.</p>
          <p className="mt-2">
            Questions? <Link href="/contact" className="underline">Contact us</Link>
          </p>
        </div>
      </div>
    </div>
  );
} 