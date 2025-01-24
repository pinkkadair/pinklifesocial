"use client";

import { ErrorBoundary } from 'react-error-boundary';
import { Button } from '@/components/ui/button';
import { useCallback } from 'react';

const ErrorFallback = ({ error, resetErrorBoundary }: { 
  error: Error; 
  resetErrorBoundary: () => void;
}) => {
  const handleReset = useCallback(() => {
    resetErrorBoundary();
  }, [resetErrorBoundary]);

  const handleRefresh = useCallback(() => {
    window.location.reload();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="max-w-md w-full space-y-4 text-center">
        <h2 className="text-2xl font-bold">Something went wrong</h2>
        <p className="text-muted-foreground">
          {error.message || 'An unexpected error occurred'}
        </p>
        <div className="space-x-4">
          <Button onClick={handleReset} variant="default">
            Try again
          </Button>
          <Button onClick={handleRefresh} variant="outline">
            Refresh page
          </Button>
        </div>
      </div>
    </div>
  );
};

interface GlobalErrorBoundaryProps {
  children: React.ReactNode;
}

export default function GlobalErrorBoundary({ children }: GlobalErrorBoundaryProps) {
  const handleError = useCallback((error: Error) => {
    console.error('Global error caught:', error);
  }, []);

  const handleReset = useCallback(() => {
    // Clear any error state or perform cleanup
    window.location.reload();
  }, []);

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={handleError}
      onReset={handleReset}
    >
      {children}
    </ErrorBoundary>
  );
} 