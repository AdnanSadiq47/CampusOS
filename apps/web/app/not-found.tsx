import React from 'react';
import { Button } from '@/components/ui/button';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center p-6">
      <div className="flex max-w-md flex-col items-center space-y-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <FileQuestion className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-semibold tracking-tight">Resource Not Found</h2>
        <p className="text-xs text-muted-foreground">
          The requested page, entity, or module could not be found or you do not have permission to view it.
        </p>
        <a href="/">
          <Button variant="outline" size="sm">
            Return to Dashboard
          </Button>
        </a>
      </div>
    </div>
  );
}
