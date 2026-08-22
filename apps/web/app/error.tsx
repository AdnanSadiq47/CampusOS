'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center p-6">
      <div className="flex max-w-md flex-col items-center space-y-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-semibold tracking-tight">Something went wrong</h2>
        <p className="text-xs text-muted-foreground">
          {error.message || 'An unexpected error occurred while processing your request.'}
        </p>
        <Button variant="primary" size="sm" onClick={() => reset()}>
          Try again
        </Button>
      </div>
    </div>
  );
}
