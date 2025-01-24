"use client";

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SUBSCRIPTION_PLANS } from "@/lib/stripe";

interface MembershipDialogProps {
  currentTier: "FREE" | "PINKU" | "VIP";
  children: React.ReactNode;
  onClose?: () => void;
}

export default function MembershipDialog({ currentTier, children, onClose }: MembershipDialogProps) {
  return (
    <Dialog onOpenChange={onClose}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl">
        <div className="grid gap-6 md:grid-cols-3">
          {Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => (
            <Card key={key} className={`${currentTier === key ? "border-primary" : ""}`}>
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <div className="text-2xl font-bold">
                  {plan.price === 0 ? (
                    "Free"
                  ) : (
                    <>
                      ${plan.price}
                      <span className="text-sm font-normal text-muted-foreground">
                        /month
                      </span>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {plan.features.map((feature: string, index: number) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
                {key !== "FREE" && (
                  <Button
                    className="mt-4 w-full"
                    variant={currentTier === key ? "outline" : "default"}
                    asChild
                  >
                    <a href={plan.url} target="_blank" rel="noopener noreferrer">
                      {currentTier === key ? "Manage" : "Upgrade"}
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
} 