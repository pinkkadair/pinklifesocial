"use client";

import { SessionProvider } from "next-auth/react";
import { ErrorBoundary } from 'react-error-boundary';
import { useCallback } from 'react';

const ErrorFallback = () => {
  const handleRetry = useCallback(() => {
    window.location.reload();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="text-center space-y-4">
        <p className="text-lg">Error loading authentication</p>
        <button
          onClick={handleRetry}
          className="px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600"
        >
          Retry
        </button>
      </div>
    </div>
  );
};

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const handleError = (error: Error) => {
    console.error('Auth Error:', error);
  };

  return (
    <ErrorBoundary 
      FallbackComponent={ErrorFallback}
      onError={handleError}
    >
      <SessionProvider>{children}</SessionProvider>
    </ErrorBoundary>
  );
} 