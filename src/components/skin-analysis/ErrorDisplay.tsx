'use client';

import React, { memo } from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorDisplayProps {
  error: string;
}

const ErrorDisplay = memo(function ErrorDisplay({ error }: ErrorDisplayProps) {
  return (
    <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm flex items-center">
      <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
      <span>{error}</span>
    </div>
  );
});

export default ErrorDisplay; 