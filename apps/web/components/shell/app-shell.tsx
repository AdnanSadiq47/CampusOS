'use client';

import React from 'react';
import { Header } from './header';
import { Sidebar } from './sidebar';
import { Breadcrumbs, BreadcrumbItem } from './breadcrumbs';

export interface AppShellProps {
  children: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  organizationName?: string;
  userEmail?: string;
}

export function AppShell({ children, breadcrumbs, organizationName, userEmail }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header organizationName={organizationName} userEmail={userEmail} />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 overflow-y-auto min-h-[calc(100vh-3.5rem)]">
          <Breadcrumbs items={breadcrumbs} />
          {children}
        </main>
      </div>
    </div>
  );
}
