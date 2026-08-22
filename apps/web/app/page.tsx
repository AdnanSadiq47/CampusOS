import React from 'react';
import { AppShell } from '@/components/shell/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Shield, Layers, Database, Lock } from 'lucide-react';

export default function HomePage() {
  const foundationHighlights = [
    {
      title: 'Multi-Tenant Isolation',
      desc: 'Dual-layer security boundary: Application ABAC and PostgreSQL Row-Level Security (RLS).',
      icon: Shield,
    },
    {
      title: 'Configurable Hierarchy',
      desc: 'Arbitrary-depth organization hierarchy engine with ltree indexing.',
      icon: Layers,
    },
    {
      title: 'Dynamic Entity & Form Core',
      desc: 'Metadata-driven runtime supporting 20+ field types and immutable versioning.',
      icon: Database,
    },
    {
      title: 'Strict IAM & Data Scopes',
      desc: 'Hierarchical data scopes, dynamic roles, and fine-grained field-level permissions.',
      icon: Lock,
    },
  ];

  return (
    <AppShell breadcrumbs={[{ label: 'Platform Foundation' }]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Platform Foundation Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">
            CampusOS Core Infrastructure, Multi-Tenancy Boundary & Identity System.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {foundationHighlights.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Card key={idx}>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                  <Icon className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Architecture Status: Phase 1 Foundation & Phase 2 Platform Engines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-muted-foreground">
            <p>
              ✅ Monorepo workspace established (Next.js 14 App Router + NestJS 10 Core API + Drizzle ORM).
            </p>
            <p>
              ✅ Multi-tenancy context resolution with connection-level PostgreSQL FORCE RLS protection.
            </p>
            <p>
              ✅ Dynamic Virtual ORM, Form AST Compiler, Workflow FSM, and Pluggable Modules active.
            </p>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-lg font-bold tracking-tight mb-3">Interactive Visual Builder Suites (Phase 2)</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <a
              href="/builders/hierarchy"
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-indigo-500 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🌳</span>
                <div>
                  <h3 className="font-semibold text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400">Hierarchy Tree Builder</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Multi-tier organizational tree & ltree inspector</p>
                </div>
              </div>
            </a>

            <a
              href="/builders/entities"
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-indigo-500 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">📦</span>
                <div>
                  <h3 className="font-semibold text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400">Entity Builder</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Polymorphic custom fields & Virtual ORM models</p>
                </div>
              </div>
            </a>

            <a
              href="/builders/forms"
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-indigo-500 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">📝</span>
                <div>
                  <h3 className="font-semibold text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400">Form Builder & Preview</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Live AST compiler, tabs, sections & rule evaluation</p>
                </div>
              </div>
            </a>

            <a
              href="/builders/workflows"
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-indigo-500 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚡</span>
                <div>
                  <h3 className="font-semibold text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400">Workflow FSM Builder</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Finite state machine transitions & role approval gates</p>
                </div>
              </div>
            </a>

            <a
              href="/builders/navigation"
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-indigo-500 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🧭</span>
                <div>
                  <h3 className="font-semibold text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400">Navigation Menu Builder</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Dynamic navigation trees & role visibility rules</p>
                </div>
              </div>
            </a>

            <a
              href="/modules"
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-indigo-500 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🧩</span>
                <div>
                  <h3 className="font-semibold text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400">Pluggable Modules</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Modular domain feature flags & dependency matrix</p>
                </div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
