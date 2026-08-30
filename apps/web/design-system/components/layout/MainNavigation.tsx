'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { MAIN_ERP_MODULES } from '../../../lib/navigation-registry';
import { NavIcon } from '../../../components/NavIcon';
import { StudentCascadingMenu } from '../../../components/StudentCascadingMenu';

export interface MainNavigationProps {
  currentPath?: string;
  isInteractive?: boolean;
  className?: string;
}

export function MainNavigation({
  currentPath,
  isInteractive = true,
  className = '',
}: MainNavigationProps) {
  const activePathname = usePathname();
  const effectivePath = currentPath || activePathname || '/';
  const [openMegaMenuId, setOpenMegaMenuId] = useState<string | null>(null);
  const navContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navContainerRef.current && !navContainerRef.current.contains(event.target as Node)) {
        setOpenMegaMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 ${className}`}>
      <div className="max-w-[1540px] mx-auto px-3 sm:px-6">
        <nav className="flex items-center gap-0.5 py-0.5 overflow-visible" ref={navContainerRef}>
          {MAIN_ERP_MODULES.map((mod) => {
            const isActive = mod.match(effectivePath);
            const isMegaOpen = openMegaMenuId === mod.id;

            if (mod.isMegaMenu) {
              return (
                <div
                  key={mod.id}
                  className="relative"
                  onMouseEnter={() => isInteractive && setOpenMegaMenuId(mod.id)}
                  onMouseLeave={() => isInteractive && setOpenMegaMenuId(null)}
                >
                  <button
                    type="button"
                    onClick={() => isInteractive && setOpenMegaMenuId(isMegaOpen ? null : mod.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'border-blue-600 text-blue-900 dark:text-blue-200 dark:border-blue-400 bg-blue-50/70 dark:bg-blue-950/50 font-bold'
                        : 'border-transparent text-slate-700 dark:text-slate-300 hover:text-blue-900 dark:hover:text-blue-200 hover:bg-blue-50/50 dark:hover:bg-blue-950/30'
                    }`}
                  >
                    <NavIcon
                      name={mod.icon}
                      variant={isActive ? 'active' : 'default'}
                      className="w-4 h-4 shrink-0"
                    />
                    <span>{mod.label}</span>
                    <ChevronDown className={`w-3 h-3 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  </button>

                  <StudentCascadingMenu
                    isOpen={isMegaOpen}
                    onClose={() => setOpenMegaMenuId(null)}
                  />
                </div>
              );
            }

            if (mod.soon) {
              return (
                <span
                  key={mod.id}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 cursor-default whitespace-nowrap"
                >
                  <NavIcon
                    name={mod.icon}
                    variant="muted"
                    className="w-4 h-4 shrink-0"
                  />
                  <span>{mod.label}</span>
                </span>
              );
            }

            return (
              <Link
                key={mod.id}
                href={mod.href}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-blue-600 text-blue-900 dark:text-blue-200 dark:border-blue-400 bg-blue-50/70 dark:bg-blue-950/50 font-bold'
                    : 'border-transparent text-slate-700 dark:text-slate-300 hover:text-blue-900 dark:hover:text-blue-200 hover:bg-blue-50/50 dark:hover:bg-blue-950/30'
                }`}
              >
                <NavIcon
                  name={mod.icon}
                  variant={isActive ? 'active' : 'default'}
                  className="w-4 h-4 shrink-0"
                />
                <span>{mod.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
