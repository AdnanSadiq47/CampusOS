'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PostalCodesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Graceful automatic redirect to Areas / Zones
    router.replace('/admin-config/areas');
  }, [router]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center space-y-4 max-w-lg mx-auto">
      <div className="h-16 w-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center text-3xl">
        📮
      </div>
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Postal Codes are now managed in Areas / Zones
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Postal and ZIP code configurations are now directly integrated into local neighborhood Areas & Zones for a streamlined administrative experience.
        </p>
      </div>
      <Link
        href="/admin-config/areas"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
      >
        <span>Go to Areas / Zones</span>
        <span>→</span>
      </Link>
    </div>
  );
}
