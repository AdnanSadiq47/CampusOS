'use client';

import React from 'react';
import {
  LayoutDashboard,
  Network,
  Users,
  Shield,
  Layers,
  FileCode2,
  GitFork,
  BookOpen,
  Receipt,
  FileSpreadsheet,
  Settings,
} from 'lucide-react';

export function Sidebar() {
  const navigationGroups = [
    {
      title: 'Platform Foundation',
      items: [
        { label: 'Overview', icon: LayoutDashboard, href: '/' },
        { label: 'Organization Hierarchy', icon: Network, href: '/hierarchy' },
        { label: 'Users & Identity', icon: Users, href: '/users' },
        { label: 'Roles & Permissions', icon: Shield, href: '/roles' },
      ],
    },
    {
      title: 'Platform Builders',
      items: [
        { label: 'Entity Builder', icon: Layers, href: '/builders/entities' },
        { label: 'Form Builder', icon: FileCode2, href: '/builders/forms' },
        { label: 'Workflow Builder', icon: GitFork, href: '/builders/workflows' },
        { label: 'Report Builder', icon: FileSpreadsheet, href: '/builders/reports' },
      ],
    },
    {
      title: 'Domain Modules',
      items: [
        { label: 'Academics & SIS', icon: BookOpen, href: '/modules/academics' },
        { label: 'Fee & Accounting', icon: Receipt, href: '/modules/finance' },
      ],
    },
    {
      title: 'Settings',
      items: [{ label: 'Platform Config', icon: Settings, href: '/settings' }],
    },
  ];

  return (
    <aside className="w-60 shrink-0 border-r bg-muted/20 min-h-[calc(100vh-3.5rem)] p-3">
      <div className="space-y-6">
        {navigationGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            <div className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {group.title}
            </div>
            <div className="space-y-0.5 pt-1">
              {group.items.map((item, iIdx) => {
                const Icon = item.icon;
                return (
                  <a
                    key={iIdx}
                    href={item.href}
                    className="flex items-center space-x-2.5 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span>{item.label}</span>
                  </a>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
