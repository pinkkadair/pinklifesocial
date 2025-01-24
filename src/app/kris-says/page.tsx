import { Metadata } from "next";
import KrisSaysClient from "@/components/kris-says/KrisSaysClient";

export const metadata: Metadata = {
  title: "Kris Says... | PinkLife",
  description: "Get personalized beauty and wellness advice from Kris",
};

export default async function KrisSaysPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Kris Says...</h1>
        <p className="text-muted-foreground">
          Ask Kris your beauty and wellness questions, get personalized advice and insights.
        </p>
      </div>
      <KrisSaysClient />
    </div>
  );
} 