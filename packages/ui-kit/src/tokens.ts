import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * ============================================================
 * CAMPUSOS CENTRALIZED DESIGN TOKENS
 * ============================================================
 * Canonical source of truth for visual tokens across CampusOS.
 * Any global visual change should be made here or via controlled variants.
 */

export const designTokens = {
  // ── 3.1 COLORS ──────────────────────────────────────────────
  colors: {
    // Brand / Primary
    primary: {
      50: '#eef2ff',
      100: '#e0e7ff',
      200: '#c7d2fe',
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#6366f1',
      600: '#4f46e5', // Primary Brand Base
      700: '#4338ca',
      800: '#3730a3',
      900: '#312e81',
      DEFAULT: '#4f46e5',
      hover: '#4338ca',
      active: '#3730a3',
      foreground: '#ffffff',
    },
    // Secondary
    secondary: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      600: '#475569',
      DEFAULT: '#f1f5f9',
      hover: '#e2e8f0',
      active: '#cbd5e1',
      foreground: '#0f172a',
    },
    // Accent
    accent: {
      DEFAULT: '#f1f5f9',
      hover: '#e2e8f0',
      foreground: '#0f172a',
    },
    // Semantic States
    success: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
      DEFAULT: '#10b981',
      hover: '#059669',
      foreground: '#ffffff',
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      DEFAULT: '#f59e0b',
      hover: '#d97706',
      foreground: '#ffffff',
    },
    danger: {
      50: '#fff1f2',
      100: '#ffe4e6',
      200: '#fecdd3',
      500: '#f43f5e',
      600: '#e11d48',
      700: '#be123c',
      DEFAULT: '#e11d48',
      hover: '#be123c',
      foreground: '#ffffff',
    },
    info: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      DEFAULT: '#2563eb',
      hover: '#1d4ed8',
      foreground: '#ffffff',
    },
    // Neutral Scale
    neutral: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617',
    },
    // Structural Semantic Colors
    pageBackground: {
      light: '#f8fafc',
      dark: '#020617',
    },
    surface: {
      light: '#ffffff',
      dark: '#0b0f19',
    },
    surfaceElevated: {
      light: '#ffffff',
      dark: '#111827',
    },
    cardBackground: {
      light: '#ffffff',
      dark: '#0b0f19',
    },
    inputBackground: {
      light: '#ffffff',
      dark: '#0f172a',
    },
    // Borders
    border: {
      light: '#e2e8f0',
      dark: '#1e293b',
    },
    borderMuted: {
      light: '#f1f5f9',
      dark: '#0f172a',
    },
    borderStrong: {
      light: '#cbd5e1',
      dark: '#334155',
    },
    // Typography Colors
    textPrimary: {
      light: '#0f172a',
      dark: '#f8fafc',
    },
    textSecondary: {
      light: '#475569',
      dark: '#94a3b8',
    },
    textMuted: {
      light: '#94a3b8',
      dark: '#64748b',
    },
    textDisabled: {
      light: '#cbd5e1',
      dark: '#475569',
    },
    // Interactive
    link: '#4f46e5',
    linkHover: '#4338ca',
    overlay: 'rgba(15, 23, 42, 0.75)',
    focus: '#6366f1',
  },

  // ── 3.2 TYPOGRAPHY ──────────────────────────────────────────
  typography: {
    fontFamily: {
      sans: "var(--font-inter), 'Inter', system-ui, -apple-system, sans-serif",
      mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    },
    fontSize: {
      xs: '0.75rem',     // 12px
      sm: '0.875rem',    // 14px
      base: '1rem',      // 16px
      lg: '1.125rem',    // 18px
      xl: '1.25rem',     // 20px
      '2xl': '1.5rem',   // 24px
      '3xl': '1.875rem', // 30px
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.625',
    },
    letterSpacing: {
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
      wider: '0.05em',
    },
    semantic: {
      pageTitle: { size: '1.25rem', weight: '700', letterSpacing: '-0.02em' },
      sectionTitle: { size: '1rem', weight: '600' },
      cardTitle: { size: '0.875rem', weight: '600' },
      body: { size: '0.875rem', weight: '400' },
      label: { size: '0.75rem', weight: '600', letterSpacing: '0.025em' },
      helper: { size: '0.75rem', weight: '400' },
      tableHeader: { size: '0.75rem', weight: '600', letterSpacing: '0.05em' },
      tableBody: { size: '0.875rem', weight: '400' },
      breadcrumb: { size: '0.75rem', weight: '600' },
      tab: { size: '0.8125rem', weight: '600' },
      button: { size: '0.8125rem', weight: '600' },
    },
  },

  // ── 3.3 SPACING ─────────────────────────────────────────────
  spacing: {
    pagePadding: '1.5rem',     // 24px
    sectionGap: '1.25rem',     // 20px
    cardPadding: '1.25rem',    // 20px
    cardGap: '1rem',           // 16px
    tableCellPadding: {
      compact: '0.5rem 0.75rem',
      normal: '0.875rem 1rem',
      comfortable: '1.125rem 1.25rem',
    },
    formGap: '1rem',
    formSectionGap: '1.5rem',
    fieldGap: '0.375rem',
    buttonPadding: {
      sm: '0.375rem 0.75rem',
      md: '0.5rem 1rem',
      lg: '0.625rem 1.25rem',
    },
    modalPadding: '1.5rem',
    tabGap: '0.5rem',
  },

  // ── 3.4 RADIUS ──────────────────────────────────────────────
  radius: {
    xs: '0.25rem',   // 4px
    sm: '0.375rem',  // 6px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    '2xl': '1.25rem',// 20px
    pill: '9999px',
    semantic: {
      button: '0.5rem',
      actionButton: '0.5rem',
      rowActionButton: '0.5rem',
      input: '0.5rem',
      card: '0.75rem',
      table: '0.75rem',
      modal: '1rem',
      badge: '9999px',
      pill: '9999px',
      popover: '0.75rem',
    },
  },

  // ── 3.5 BORDERS ─────────────────────────────────────────────
  borders: {
    width: {
      thin: '1px',
      medium: '2px',
      thick: '3px',
    },
    style: {
      standard: '1px solid var(--border)',
      muted: '1px solid var(--border-muted)',
      strong: '1px solid var(--border-strong)',
      focus: '2px solid var(--primary)',
      error: '1px solid var(--danger)',
    },
  },

  // ── 3.6 SHADOWS ─────────────────────────────────────────────
  shadows: {
    card: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
    cardHover: '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
    dropdown: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    popover: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    modal: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    floatingAction: '0 10px 25px -5px rgba(79, 70, 229, 0.3)',
  },

  // ── 3.7 CONTROL SIZES ───────────────────────────────────────
  controls: {
    buttonHeight: {
      sm: '2rem',       // 32px
      md: '2.375rem',   // 38px
      lg: '2.75rem',    // 44px
    },
    actionButton: {
      height: '2.25rem', // 36px
      fontSize: '0.8125rem',
      fontWeight: '600',
    },
    rowAction: {
      size: '1.75rem',   // 28px (h-7 w-7)
      iconSize: '1rem',
      radius: '0.5rem',  // rounded-lg
    },
    inputHeight: {
      sm: '2rem',
      md: '2.375rem',
      lg: '2.75rem',
    },
    badgeHeight: '1.375rem', // 22px
    headerHeight: '3.75rem', // 60px
    tabHeight: '2.25rem',    // 36px
  },

  // ── 3.8 MODAL SIZES ─────────────────────────────────────────
  modals: {
    width: {
      sm: '28rem',       // 448px (max-w-md)
      md: '36rem',       // 576px (max-w-lg)
      lg: '42rem',       // 672px (max-w-2xl)
      wide: '48rem',     // 768px (max-w-3xl)
      form: '64rem',     // 1024px-1100px (max-w-5xl)
      details: '64rem',  // 1024px-1100px (max-w-5xl)
      extraWide: '72rem',// 1152px (max-w-6xl)
      fullscreenSafe: '92vw',
    },
  },

  // ── 3.9 Z-INDEX / LAYERS ────────────────────────────────────
  zIndex: {
    base: 0,
    stickyContent: 10,
    header: 30,
    navigation: 40,
    dropdown: 50,
    popover: 60,
    modalBackdrop: 90,
    modal: 100,
    nestedModal: 120,
    nestedPopover: 130,
    toast: 150,
  },

  // ── 3.10 MOTION ─────────────────────────────────────────────
  motion: {
    duration: {
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
    },
    easing: {
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },

  // ── 3.11 RESPONSIVE BREAKPOINTS ─────────────────────────────
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
};

export type DesignTokens = typeof designTokens;
