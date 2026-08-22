'use client';

import React from 'react';
import { Bell, Search, User, ShieldCheck } from 'lucide-react';
import { TenantSwitcher } from './tenant-switcher';

export interface HeaderProps {
  organizationName?: string;
  userEmail?: string;
}

export function Header({ organizationName = 'National University', userEmail = 'admin@campus.edu' }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b bg-background/95 px-4 backdrop-blur">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 font-bold text-primary">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <span className="text-lg tracking-tight">CampusOS</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <TenantSwitcher currentTenantName={organizationName} />
      </div>

      <div className="flex items-center space-x-3">
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search resources, modules, entities... (Cmd+K)"
            className="h-9 w-64 rounded-md border border-input bg-muted/50 pl-8 pr-4 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>

        <button
          aria-label="Notifications"
          className="relative rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
        </button>

        <div className="flex items-center space-x-2 border-l pl-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <User className="h-4 w-4" />
          </div>
          <div className="hidden text-left text-xs md:block">
            <div className="font-medium text-foreground">System Administrator</div>
            <div className="text-muted-foreground">{userEmail}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
