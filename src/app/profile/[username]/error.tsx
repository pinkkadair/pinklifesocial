'use client';

import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function ProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Profile error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      <h1 className="text-4xl font-bold mb-4">Something went wrong</h1>
      <p className="text-muted-foreground text-lg mb-8">
        {error.message || 'Failed to load profile. Please try again later.'}
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
} 