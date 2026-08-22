'use client';

import React from 'react';
import { Building2, ChevronDown } from 'lucide-react';

export interface TenantSwitcherProps {
  currentTenantName?: string;
}

export function TenantSwitcher({ currentTenantName = 'Default Organization' }: TenantSwitcherProps) {
  return (
    <div className="flex items-center space-x-2 rounded-md border border-border px-2.5 py-1 text-xs hover:bg-accent cursor-pointer">
      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="font-semibold text-foreground max-w-[140px] truncate">{currentTenantName}</span>
      <ChevronDown className="h-3 w-3 text-muted-foreground" />
    </div>
  );
}
