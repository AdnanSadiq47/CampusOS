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
            <CardTitle>Architecture Status: Phase 1 Foundation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-muted-foreground">
            <p>
              ✅ Monorepo workspace established (Next.js 14 App Router + NestJS 10 Core API + Drizzle ORM).
            </p>
            <p>
              ✅ Multi-tenancy context resolution with connection-level RLS context protection.
            </p>
            <p>
              ✅ Enterprise design system and foundational Staff/Admin application shell active.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
