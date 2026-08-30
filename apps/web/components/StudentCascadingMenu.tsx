'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import {
  STUDENT_CASCADING_MENU,
} from '../lib/navigation-registry';
import { NavIcon } from './NavIcon';

export interface StudentCascadingMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StudentCascadingMenu({ isOpen, onClose }: StudentCascadingMenuProps) {
  const pathname = usePathname();
  const [activeHoverId, setActiveHoverId] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  if (!isOpen) return null;

  const handleRowMouseEnter = (itemId: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setActiveHoverId(itemId);
  };

  const handleRowMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveHoverId(null);
    }, 180);
  };

  return (
    <div
      className="absolute left-0 top-full pt-1 z-50 animate-in fade-in zoom-in-95 duration-100"
      onMouseLeave={() => {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        onClose();
      }}
    >
      {/* ── 1. FIRST LEVEL STUDENT MENU ───────────────────────────────── */}
      <div className="w-[245px] sm:w-[260px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl ring-1 ring-black/5 dark:ring-white/5 py-1.5 z-40 text-xs">
        {STUDENT_CASCADING_MENU.map((item) => {
          const isItemActive =
            (item.match && item.match(pathname)) || item.href === pathname;
          const isHovered = activeHoverId === item.id;
          const hasFlyout = Boolean(item.hasChildren && item.children && item.children.length > 0);

          // Disabled "Soon" item (without flyout)
          if (item.soon && !hasFlyout) {
            return (
              <div
                key={item.id}
                onMouseEnter={() => handleRowMouseEnter(item.id)}
                onMouseLeave={handleRowMouseLeave}
                className="flex items-center justify-between px-3.5 py-2 text-slate-600 dark:text-slate-300 cursor-default text-xs font-medium"
              >
                <div className="flex items-center gap-2.5">
                  {item.icon && (
                    <NavIcon
                      name={item.icon}
                      variant="muted"
                      className="w-4 h-4 shrink-0"
                    />
                  )}
                  <span>{item.label}</span>
                </div>
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded font-semibold border border-slate-200/80 dark:border-slate-700/80">
                  Soon
                </span>
              </div>
            );
          }

          // Disabled "Soon" item (with chevron)
          if (item.soon && hasFlyout && !item.isImplemented) {
            return (
              <div
                key={item.id}
                onMouseEnter={() => handleRowMouseEnter(item.id)}
                onMouseLeave={handleRowMouseLeave}
                className="flex items-center justify-between px-3.5 py-2 text-slate-600 dark:text-slate-300 cursor-default text-xs font-medium"
              >
                <div className="flex items-center gap-2.5">
                  {item.icon && (
                    <NavIcon
                      name={item.icon}
                      variant="muted"
                      className="w-4 h-4 shrink-0"
                    />
                  )}
                  <span>{item.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded font-semibold border border-slate-200/80 dark:border-slate-700/80">
                    Soon
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </div>
              </div>
            );
          }

          // Available / Clickable item (e.g. Pre-Admission)
          return (
            <div
              key={item.id}
              className="relative group"
              onMouseEnter={() => handleRowMouseEnter(item.id)}
              onMouseLeave={handleRowMouseLeave}
            >
              {/* Row Link */}
              <Link
                href={item.href}
                onClick={onClose}
                className={`flex items-center justify-between px-3.5 py-2 cursor-pointer transition-colors duration-150 ${
                  isHovered || isItemActive
                    ? 'bg-blue-50/90 dark:bg-blue-950/70 text-blue-900 dark:text-blue-200 font-semibold border-l-2 border-blue-600'
                    : 'text-slate-800 dark:text-slate-100 hover:bg-blue-50/80 dark:hover:bg-blue-950/50 hover:text-blue-900 dark:hover:text-blue-200 font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {item.icon && (
                    <NavIcon
                      name={item.icon}
                      variant={isHovered || isItemActive ? 'active' : 'default'}
                      className="w-4 h-4 shrink-0"
                    />
                  )}
                  <span>{item.label}</span>
                </div>

                {hasFlyout && (
                  <ChevronRight
                    className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                      isHovered || isItemActive
                        ? 'text-blue-600 dark:text-blue-400 translate-x-0.5'
                        : 'text-slate-400 group-hover:text-blue-600'
                    }`}
                  />
                )}
              </Link>

              {/* ── 2. SECOND LEVEL RIGHT-SIDE FLYOUT PANEL ───────────── */}
              {hasFlyout && isHovered && item.children && (
                <div
                  className="absolute left-full top-0 -mt-1 pl-2 z-50 w-[225px] sm:w-[240px] animate-in fade-in slide-in-from-left-1 duration-100"
                  onMouseEnter={() => handleRowMouseEnter(item.id)}
                  onMouseLeave={handleRowMouseLeave}
                >
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl ring-1 ring-black/5 dark:ring-white/5 py-1.5 text-xs">
                    {/* Flyout Title Header */}
                    <div className="px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 mb-1">
                      {item.label}
                    </div>

                    {/* Flyout Child Items */}
                    <div className="space-y-0.5">
                      {item.children.map((child) => {
                        const isChildActive =
                          child.href !== '#' &&
                          (pathname === child.href ||
                            (child.href !== '/admissions/pre-admissions' && pathname.startsWith(child.href)));

                        if (child.soon) {
                          return (
                            <div
                              key={child.id}
                              className="flex items-center justify-between px-3.5 py-1.5 text-slate-600 dark:text-slate-300 text-xs font-medium cursor-default"
                            >
                              <div className="flex items-center gap-2">
                                {child.icon && (
                                  <NavIcon
                                    name={child.icon}
                                    variant="muted"
                                    className="w-3.5 h-3.5 shrink-0"
                                  />
                                )}
                                <span>{child.label}</span>
                              </div>
                              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded font-semibold border border-slate-200/80 dark:border-slate-700/80">
                                Soon
                              </span>
                            </div>
                          );
                        }

                        return (
                          <Link
                            key={child.id}
                            href={child.href}
                            onClick={onClose}
                            className={`flex items-center justify-between px-3.5 py-1.5 transition-colors duration-150 ${
                              isChildActive
                                ? 'bg-blue-50/90 dark:bg-blue-950/70 text-blue-900 dark:text-blue-200 font-bold border-l-2 border-blue-600'
                                : 'text-slate-800 dark:text-slate-100 hover:bg-blue-50/80 dark:hover:bg-blue-950/50 hover:text-blue-900 dark:hover:text-blue-200 font-medium'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {child.icon && (
                                <NavIcon
                                  name={child.icon}
                                  variant={isChildActive ? 'active' : 'default'}
                                  className="w-3.5 h-3.5 shrink-0"
                                />
                              )}
                              <span>{child.label}</span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
