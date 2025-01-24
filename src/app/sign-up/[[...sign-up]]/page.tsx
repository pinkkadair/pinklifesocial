'use client';

import { signIn } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    signIn(undefined, { callbackUrl: "/" });
  }, []);

  return (
    <div className="flex items-center justify-center py-24">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Redirecting to sign in...</h1>
        <p className="text-muted-foreground">Please wait while we redirect you to the sign in page.</p>
      </div>
    </div>
  );
} 