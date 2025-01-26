import { Metadata } from "next";
import { auth } from "@/lib/auth";
// Removed authOptions import - using auth() directly;
import { SUBSCRIPTION_PLANS } from "@/lib/stripe";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckIcon } from "lucide-react";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Membership Plans",
  description: "Choose a membership plan that's right for you",
};

export default async function MembershipPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }

  const tier = session.user.subscriptionTier;

  return (
    <div className="container max-w-6xl py-8">
      <div className="mx-auto flex max-w-3xl flex-col items-center space-y-4 text-center">
        <h1 className="text-3xl font-bold">Choose Your Membership Plan</h1>
        <p className="text-muted-foreground">
          Select a plan that best fits your beauty journey
        </p>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => (
          <Card
            key={key}
            className={`relative flex flex-col ${
              tier === key ? "border-primary" : ""
            }`}
          >
            {tier === key && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-sm font-medium text-primary-foreground">
                Current Plan
              </div>
            )}

            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>
                {plan.price === 0 ? (
                  "Free"
                ) : (
                  <>
                    ${plan.price}
                    <span className="text-muted-foreground">/month</span>
                  </>
                )}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <ul className="space-y-2">
                {plan.features.map((feature: string, index: number) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckIcon className={`h-5 w-5 shrink-0 ${
                      tier === 'VIP' 
                        ? 'text-pink-500'
                        : tier === 'PINKU'
                        ? 'text-pink-400'
                        : 'text-green-500'
                    }`} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <div className="mt-auto p-6">
              {key !== "FREE" && (
                <Button
                  className="w-full"
                  variant={tier === key ? "outline" : "default"}
                  asChild
                >
                  <a
                    href={plan.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {tier === key ? "Manage Subscription" : "Upgrade"}
                  </a>
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
} 