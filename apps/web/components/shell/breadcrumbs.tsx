import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
}

export function Breadcrumbs({ items = [{ label: 'Dashboard' }] }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center space-x-1.5 text-xs text-muted-foreground mb-4">
      <a href="/" className="flex items-center hover:text-foreground">
        <Home className="h-3.5 w-3.5" />
      </a>
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
          {item.href ? (
            <a href={item.href} className="hover:text-foreground">
              {item.label}
            </a>
          ) : (
            <span className="font-medium text-foreground">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
