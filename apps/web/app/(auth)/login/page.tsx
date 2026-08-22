'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShieldCheck, Lock, Mail, Building } from 'lucide-react';

export default function LoginPage() {
  const [orgCode, setOrgCode] = useState('demo_univ');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-ID': orgCode,
        },
        body: JSON.stringify({ organizationCode: orgCode, email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Login failed');
      }

      window.location.href = '/';
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm shadow-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl font-bold">Sign in to CampusOS</CardTitle>
          <p className="text-xs text-muted-foreground">
            Enterprise Configurable Multi-Organization ERP
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-xs font-medium text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground flex items-center gap-1">
                <Building className="h-3.5 w-3.5 text-muted-foreground" />
                Organization Code / Subdomain
              </label>
              <Input
                type="text"
                required
                value={orgCode}
                onChange={(e) => setOrgCode(e.target.value)}
                placeholder="e.g. stanford_univ"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground flex items-center gap-1">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                Email Address
              </label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@campus.edu"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground flex items-center gap-1">
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                Password
              </label>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <Button type="submit" variant="primary" className="w-full" disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
