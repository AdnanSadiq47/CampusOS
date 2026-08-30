'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CatalogItem } from '../../registry';
import { designTokens } from '../../tokens';
import { PrimaryActionButton } from '../buttons/PrimaryActionButton';
import { Button } from '../buttons/Button';
import { AdminPageHeader } from '../headers/AdminPageHeader';
import { AdminModuleTabs } from '../tabs/AdminModuleTabs';
import { RowActions, ViewAction, EditAction, DeleteAction, StatusAction, MoreActionsMenu } from '../actions/RowActions';
import { ConnectedCountPill } from '../relationships/ConnectedCountPill';
import { AdminTable, AdminTableHead, AdminTableBody, AdminTableRow, AdminTableTh, AdminTableTd } from '../tables/AdminTable';
import { StatusBadge } from '../badges/StatusBadge';
import { FormGrid, FormField, FormSection } from '../forms/FormLayout';
import { TextInput, SelectField, Checkbox, ToggleSwitch } from '../controls/FormControls';
import { MultiSelect } from '../controls/MultiSelect';
import { HierarchyMultiSelect } from '../controls/HierarchyMultiSelect';
import { Alert, EmptyState } from '../feedback/FeedbackStates';
import { StatCard } from '../cards/StatCard';
import { AdminFilterBar } from '../filters/AdminFilterBar';
import { ConnectedUnitsModalDemo } from '../modals/ConnectedUnitsModalDemo';
import { DetailsLayoutDemo } from '../details/DetailsLayoutDemo';
import { EntityLogoDemo } from '../details/EntityLogoDemo';
import { AdminModal } from '../modals/AdminModal';
import { UtilityHeader } from '../layout/AppHeader';
import { MainNavigation } from '../layout/MainNavigation';
import { WorkingContextPicker } from '../../../components/WorkingContextPicker';
import { StudentCascadingMenu } from '../../../components/StudentCascadingMenu';
import { NavIcon } from '../../../components/NavIcon';
import {
  X,
  School,
  Clock,
  ArrowRight,
  ShieldAlert,
  Search,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Eye,
  ShieldCheck,
  Building2,
  ExternalLink as ExtIcon,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react';

export interface ComponentPreviewModalProps {
  item: CatalogItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ComponentPreviewModal({ item, isOpen, onClose }: ComponentPreviewModalProps) {
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [activeState, setActiveState] = useState<'normal' | 'hover' | 'active' | 'disabled' | 'loading' | 'error'>('normal');
  const [interactiveModalOpen, setInteractiveModalOpen] = useState<boolean>(false);
  const [nestedModalOpen, setNestedModalOpen] = useState<boolean>(false);
  const [tableDensity, setTableDensity] = useState<'compact' | 'normal' | 'comfortable'>('normal');
  const [sortState, setSortState] = useState<'none' | 'asc' | 'desc'>('asc');
  const [checkboxChecked, setCheckboxChecked] = useState<boolean>(true);
  const [toggleChecked, setToggleChecked] = useState<boolean>(true);
  const [selectedRadio, setSelectedRadio] = useState<string>('cambridge');
  const [textInputValue, setTextInputValue] = useState<string>('Beacon Horizon Clifton Campus');
  const [selectedDropdownOption, setSelectedDropdownOption] = useState<string>('secondary');
  const [navDropdownOpen, setNavDropdownOpen] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [activeSubTab, setActiveSubTab] = useState<string>('overview');
  const [multiSelectValue, setMultiSelectValue] = useState<string[]>(['clifton', 'dha']);
  const [hierarchyMultiValue, setHierarchyMultiValue] = useState<string[]>(['br-0091', 'br-0092']);

  React.useEffect(() => {
    if (item && item.variants.length > 0) {
      setSelectedVariant(item.variants[0] || '');
      setActiveState('normal');
      setNavDropdownOpen(true);
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const isTrueLive = item.status === 'LIVE';
  const previewSource = isTrueLive ? item.sharedSource : 'Pending Implementation';

  const renderUniquePreview = () => {
    // If PLANNED, render roadmap placeholder
    if (item.status === 'PLANNED') {
      return (
        <div className="p-6 rounded-2xl border-2 border-dashed border-amber-300 dark:border-amber-700/60 bg-amber-50/50 dark:bg-amber-950/20 text-center space-y-3 w-full">
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
              PLANNED — NOT IMPLEMENTED
            </span>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{item.displayName}</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              This item is an agreed standard in the CampusOS roadmap. Reusable centralized component implementation is scheduled in the upcoming phased release.
            </p>
          </div>
          <div className="pt-2 text-[10px] font-mono text-slate-400">
            Target Token Source: {item.tokenSource}
          </div>
        </div>
      );
    }

    // Granular subject renderer matching exact canonical standard
    switch (item.canonicalName) {
      // ═════════════════════════════════════════════════════════════════════
      // 01. FOUNDATION / GLOBAL THEME
      // ═════════════════════════════════════════════
      case 'CampusTheme':
        return (
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-left space-y-3 w-full">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Root CampusOS Design System Theme</h4>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs font-mono text-slate-600 dark:text-slate-300 space-y-1">
              <div>--font-sans: 'Inter', system-ui, sans-serif</div>
              <div>--primary-brand: {designTokens.colors.primary[600]}</div>
              <div>--page-bg: {designTokens.colors.pageBackground.light}</div>
              <div>--surface-bg: {designTokens.colors.surface.light}</div>
            </div>
            <p className="text-xs text-slate-500">
              Applied globally via <code className="font-mono text-indigo-600">@campus-os/ui-kit</code> and injected at HTML document root.
            </p>
          </div>
        );

      case 'ColorTokens':
        return (
          <div className="space-y-4 w-full">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Centralized Semantic Color Palette (Live Tokens)</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5 text-center">
              {[
                { name: 'Primary (600)', val: designTokens.colors.primary[600], token: 'colors.primary[600]' },
                { name: 'Primary Hover', val: designTokens.colors.primary[700], token: 'colors.primary[700]' },
                { name: 'Secondary Base', val: designTokens.colors.secondary[100], token: 'colors.secondary[100]' },
                { name: 'Success (500)', val: designTokens.colors.success[500], token: 'colors.success[500]' },
                { name: 'Danger (600)', val: designTokens.colors.danger[600], token: 'colors.danger[600]' },
                { name: 'Warning (500)', val: designTokens.colors.warning[500], token: 'colors.warning[500]' },
                { name: 'Info / View (600)', val: designTokens.colors.info[600], token: 'colors.info[600]' },
                { name: 'Neutral Dark', val: designTokens.colors.neutral[900], token: 'colors.neutral[900]' },
              ].map((c) => (
                <div key={c.name} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
                  <div className="h-10 rounded-lg mb-1.5 border border-black/5" style={{ backgroundColor: c.val }} />
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block truncate">{c.name}</span>
                  <span className="text-[9px] font-mono text-slate-400 block">{c.val}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'PrimaryColorToken':
        return (
          <div className="space-y-4 w-full">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Primary Brand Scale (Indigo 50-900)</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 text-center">
              {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((step) => (
                <div key={step} className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div
                    className="h-10 rounded-lg mb-1.5 shadow-2xs"
                    style={{ backgroundColor: (designTokens.colors.primary as any)[step] }}
                  />
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">primary.{step}</span>
                  <div className="text-[9px] font-mono text-slate-400">{(designTokens.colors.primary as any)[step]}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'SecondaryColorToken':
        return (
          <div className="space-y-4 w-full">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Secondary Scale (Slate 50-600)</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-center">
              {[50, 100, 200, 300, 400, 500, 600].map((step) => (
                <div key={step} className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div
                    className="h-10 rounded-lg mb-1.5 shadow-2xs"
                    style={{ backgroundColor: (designTokens.colors.secondary as any)[step] || '#475569' }}
                  />
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">secondary.{step}</span>
                  <div className="text-[9px] font-mono text-slate-400">{(designTokens.colors.secondary as any)[step] || '#475569'}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'AccentColorTokens':
        return (
          <div className="space-y-4 w-full">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Accent Colors (Live designTokens.colors.accent)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              {[
                { name: 'Accent Base', val: designTokens.colors.accent.DEFAULT, token: 'colors.accent.DEFAULT' },
                { name: 'Accent Hover', val: designTokens.colors.accent.hover, token: 'colors.accent.hover' },
                { name: 'Accent Foreground', val: designTokens.colors.accent.foreground, token: 'colors.accent.foreground' },
              ].map((a) => (
                <div key={a.name} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div className="h-12 rounded-lg mb-2 shadow-2xs" style={{ backgroundColor: a.val }} />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{a.name}</span>
                  <div className="text-[10px] font-mono text-slate-400">{a.val}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'PageBackground':
      case 'SurfaceTokens':
        return (
          <div className="space-y-4 w-full text-left">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Page Background & Surface Contrast</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Page Canvas (bg-slate-50)</span>
                <p className="text-[11px] text-slate-500 mt-1">Light: {designTokens.colors.pageBackground.light} | Dark: {designTokens.colors.pageBackground.dark}</p>
                <div className="mt-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                  Elevated Surface Container Placed Inside Canvas
                </div>
              </div>
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Surface Container (bg-white)</span>
                <p className="text-[11px] text-slate-500 mt-1">Light: {designTokens.colors.surface.light} | Dark: {designTokens.colors.surface.dark}</p>
              </div>
            </div>
          </div>
        );

      case 'TextColorTokens':
        return (
          <div className="space-y-3 w-full text-left p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Text Contrast Hierarchy</h4>
            <div className="space-y-2 text-xs">
              <div className="text-slate-900 dark:text-white font-bold text-base">Text Primary: Bold Titles & Headings (slate-900 / #0f172a)</div>
              <div className="text-slate-600 dark:text-slate-300 font-medium">Text Secondary: Standard Body Text, Table Content & Labels (slate-600 / #475569)</div>
              <div className="text-slate-400 dark:text-slate-500 text-[11px]">Text Muted: Helper descriptions, timestamps, placeholders (slate-400 / #94a3b8)</div>
            </div>
          </div>
        );

      case 'BorderColorTokens':
      case 'BorderTokens':
        return (
          <div className="space-y-3 w-full text-left p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Border Widths & Colors</h4>
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                <span className="font-bold">Thin (1px)</span>
                <div className="text-[10px] text-slate-400 mt-1">Standard container borders</div>
              </div>
              <div className="p-3 rounded-xl border-2 border-indigo-600 bg-indigo-50/30 dark:bg-indigo-950/20">
                <span className="font-bold text-indigo-600">Medium (2px)</span>
                <div className="text-[10px] text-slate-400 mt-1">Active tab highlights</div>
              </div>
              <div className="p-3 rounded-xl border-4 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                <span className="font-bold">Thick (4px)</span>
                <div className="text-[10px] text-slate-400 mt-1">Focus callout strips</div>
              </div>
            </div>
          </div>
        );

      case 'StatusColorTokens':
        return (
          <div className="space-y-3 w-full">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Semantic State Colors</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 font-semibold text-xs">
                Success (Emerald #10b981)
              </div>
              <div className="p-3 bg-rose-50 text-rose-800 rounded-xl border border-rose-200 font-semibold text-xs">
                Danger (Rose #e11d48)
              </div>
              <div className="p-3 bg-amber-50 text-amber-800 rounded-xl border border-amber-200 font-semibold text-xs">
                Warning (Amber #f59e0b)
              </div>
              <div className="p-3 bg-blue-50 text-blue-800 rounded-xl border border-blue-200 font-semibold text-xs">
                Info (Blue #2563eb)
              </div>
            </div>
          </div>
        );

      case 'TypographyTokens':
        return (
          <div className="space-y-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left w-full">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Typography Presets</h4>
            <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="text-2xl font-black text-slate-900 dark:text-white">Page Title (text-2xl font-black)</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">designTokens.typography.semantic.pageTitle</div>
            </div>
            <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="text-lg font-bold text-slate-800 dark:text-slate-200">Section Title (text-lg font-bold)</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">designTokens.typography.semantic.sectionTitle</div>
            </div>
            <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Table Header (text-xs uppercase)</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">designTokens.typography.semantic.tableHeader</div>
            </div>
            <div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Standard Body Text (text-xs leading-normal)</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">designTokens.typography.semantic.body</div>
            </div>
          </div>
        );

      case 'SpacingTokens':
        return (
          <div className="space-y-3 w-full">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Spacing Scale & Presets</h4>
            <div className="space-y-1.5">
              {[
                { name: 'Page Padding', val: '24px (p-6)', token: 'designTokens.spacing.pagePadding' },
                { name: 'Card Padding', val: '20px (p-5)', token: 'designTokens.spacing.cardPadding' },
                { name: 'Form Gap', val: '16px (gap-4)', token: 'designTokens.spacing.formGap' },
                { name: 'Control Height', val: '38px (h-9.5)', token: 'designTokens.controls.inputHeight' },
                { name: 'Row Action', val: '28px (h-7 w-7)', token: 'designTokens.controls.rowAction' },
              ].map((s) => (
                <div key={s.name} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{s.name}</span>
                  <span className="font-mono text-slate-500 text-[10px]">{s.val} • {s.token}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'RadiusTokens':
        return (
          <div className="space-y-3 w-full">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Border Radius Scale</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              {[
                { name: 'xs (4px)', class: 'rounded' },
                { name: 'sm (6px)', class: 'rounded-md' },
                { name: 'md / Button (8px)', class: 'rounded-lg' },
                { name: 'lg / Card (12px)', class: 'rounded-xl' },
                { name: 'xl / Modal (16px)', class: 'rounded-2xl' },
                { name: '2xl (24px)', class: 'rounded-3xl' },
                { name: 'pill (Pills / Badges)', class: 'rounded-full' },
              ].map((r) => (
                <div key={r.name} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center gap-2">
                  <div className={`w-12 h-12 bg-indigo-600/20 border-2 border-indigo-600 flex items-center justify-center ${r.class}`} />
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{r.name}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'ShadowTokens':
        return (
          <div className="space-y-3 w-full">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Elevation Depth Scale</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
              {[
                { name: 'Card (shadow-xs)', val: designTokens.shadows.card, class: 'shadow-xs' },
                { name: 'Card Hover (shadow-md)', val: designTokens.shadows.cardHover, class: 'shadow-md' },
                { name: 'Dropdown (shadow-lg)', val: designTokens.shadows.dropdown, class: 'shadow-lg' },
                { name: 'Modal (shadow-2xl)', val: designTokens.shadows.modal, class: 'shadow-2xl' },
              ].map((sh) => (
                <div key={sh.name} className={`p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl ${sh.class}`}>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{sh.name}</span>
                  <div className="text-[10px] font-mono text-slate-400 mt-1 truncate">{sh.val}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'ResponsiveTokens':
        return (
          <div className="space-y-2 w-full text-left p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-mono">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-sans">Responsive Viewport Breakpoints</h4>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800"><span>sm (Mobile Landscape / Phablet)</span><span className="text-indigo-600 font-bold">640px</span></div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800"><span>md (Tablet Portrait)</span><span className="text-indigo-600 font-bold">768px</span></div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800"><span>lg (Desktop Navigation Active)</span><span className="text-indigo-600 font-bold">1024px</span></div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800"><span>xl (Full ERP Workspace)</span><span className="text-indigo-600 font-bold">1280px</span></div>
            <div className="flex justify-between py-1"><span>2xl (Ultrawide Max Boundary)</span><span className="text-indigo-600 font-bold">1536px</span></div>
          </div>
        );

      case 'LayerTokens':
        return (
          <div className="space-y-2 w-full text-left p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-mono">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-sans">Z-Index Stacking Hierarchy</h4>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800"><span>Base Page Canvas</span><span className="text-indigo-600 font-bold">0</span></div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800"><span>Sticky Top Header Shell</span><span className="text-indigo-600 font-bold">30</span></div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800"><span>ERP Module Navigation</span><span className="text-indigo-600 font-bold">40</span></div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800"><span>Modal Dialog (AdminModal)</span><span className="text-indigo-600 font-bold">100</span></div>
            <div className="flex justify-between py-1"><span>Nested Modal (ConnectedUnitsModal)</span><span className="text-indigo-600 font-bold">120</span></div>
          </div>
        );

      case 'MotionTokens':
        return (
          <div className="grid grid-cols-3 gap-3 text-center text-xs w-full">
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="font-bold">Fast (100ms)</span>
              <div className="text-[10px] text-slate-400 mt-1">Button hovers, tooltips</div>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="font-bold">Normal (150ms)</span>
              <div className="text-[10px] text-slate-400 mt-1">Dropdowns, drawer open</div>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="font-bold">Slow (250ms)</span>
              <div className="text-[10px] text-slate-400 mt-1">Modal backdrop blur fade</div>
            </div>
          </div>
        );

      case 'FocusRing':
        return (
          <div className="flex flex-col items-center gap-3">
            <button className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold ring-2 ring-indigo-500/50 ring-offset-2 outline-none">
              Focused Control (ring-2 ring-indigo-500/50)
            </button>
            <span className="text-xs text-slate-500">Accessible focus ring indicator active across all interactive primitives</span>
          </div>
        );

      case 'ScrollbarTokens':
        return (
          <div className="w-full max-w-sm p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto text-xs whitespace-nowrap">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Horizontal Scrollable Content — Thin Styled Scrollbar Applied</span>
          </div>
        );

      // ═════════════════════════════════════════════════════════════════════
      // 02. MAIN APPLICATION LAYOUT
      // ═════════════════════════════════════════════
      case 'AppHeader':
        return (
          <div className="w-full space-y-2 text-left">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Complete Dual Top Header Shell</span>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-slate-900">
              <UtilityHeader />
              <MainNavigation isInteractive={false} />
            </div>
          </div>
        );

      case 'HeaderBrand':
        return (
          <div className="flex flex-col items-center gap-2">
            <Link href="/" className="flex items-center gap-2 group p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <div className="h-7 w-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">CampusOS</span>
                <span className="text-[9px] uppercase font-black tracking-wider px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200">Core</span>
              </div>
            </Link>
            <span className="text-xs text-slate-500">Tier 1 Header Brand Logo Badge</span>
          </div>
        );

      case 'WorkingContextSelector':
        return (
          <div className="flex flex-col items-center gap-3 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Working Context Hierarchy Picker</span>
            <WorkingContextPicker />
          </div>
        );

      case 'UserProfileMenu':
        return (
          <div className="flex flex-col items-center gap-2 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="h-7 w-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-xs">AH</div>
              <div className="flex flex-col text-left leading-tight">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Ali Hassan</div>
                <div className="text-[10px] text-slate-400">System Admin Lead</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
            </div>
            <span className="text-xs text-slate-500">User Profile Badge in Tier 1 Header</span>
          </div>
        );

      case 'AdminConfigButton':
        return (
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-slate-900 text-white shadow-xs">
              <span>Admin Config</span>
            </div>
            <span className="text-xs text-slate-500">Admin Config Button in Tier 1 Header</span>
          </div>
        );

      case 'MainNavigation':
        return (
          <div className="w-full space-y-2 text-left">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Complete MainNavigation Bar</span>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
              <MainNavigation isInteractive={true} />
            </div>
          </div>
        );

      case 'NavigationItem':
        return (
          <div className="flex flex-col items-center gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Single Navigation Item (Isolated States)</span>
            <div className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="text-center space-y-1">
                <div className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 border-b-2 border-transparent hover:bg-slate-50 rounded-t-lg">
                  <NavIcon name="dashboard" variant="default" className="w-4 h-4" />
                  <span>Dashboard (Normal)</span>
                </div>
              </div>
              <div className="text-center space-y-1">
                <div className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-blue-900 dark:text-blue-200 bg-blue-50/70 border-b-2 border-blue-600 rounded-t-lg">
                  <NavIcon name="dashboard" variant="active" className="w-4 h-4" />
                  <span>Dashboard (Active)</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'NavigationDropdown':
        return (
          <div className="flex flex-col items-center gap-3 w-full">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Dropdown Navigation Item & Cascading Flyout</span>
            <div className="relative p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 min-h-[180px]">
              <button
                type="button"
                onClick={() => setNavDropdownOpen(!navDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-blue-900 bg-blue-50 border-b-2 border-blue-600 rounded-t-lg cursor-pointer"
              >
                <NavIcon name="student" variant="active" className="w-4 h-4" />
                <span>Student</span>
                <ChevronDown className="w-3.5 h-3.5 text-blue-600" />
              </button>
              <StudentCascadingMenu isOpen={navDropdownOpen} onClose={() => setNavDropdownOpen(false)} />
            </div>
          </div>
        );

      case 'DropdownMenu':
        return (
          <div className="flex flex-col items-center gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Opened Dropdown Menu Panel</span>
            <div className="w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-1.5 text-xs space-y-0.5 text-left">
              <div className="px-2.5 py-1.5 font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer">Student Profile</div>
              <div className="px-2.5 py-1.5 font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer">Enrolled Courses</div>
              <div className="px-2.5 py-1.5 font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer">Attendance Register</div>
            </div>
          </div>
        );

      case 'PageContainer':
      case 'PageSection':
        return (
          <div className="w-full p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-left space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Page Container & Section Slot</span>
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-indigo-400 text-xs text-indigo-700 dark:text-indigo-300 font-semibold">
              max-w-[1540px] Responsive Workspace Content Slot
            </div>
          </div>
        );

      case 'AppFooter':
        return (
          <div className="w-full p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between text-slate-500">
            <span>© 2026 CampusOS Enterprise Cloud</span>
            <span className="font-mono text-[10px]">v2.4.0 • Operational</span>
          </div>
        );

      // ═════════════════════════════════════════════════════════════════════
      // 03. PAGE HEADER
      // ═════════════════════════════════════════════
      case 'AdminPageHeader':
        return (
          <div className="w-full">
            <AdminPageHeader
              section="Administration Configuration"
              sectionHref="/admin-config"
              group="Organization Setup"
              groupHref="/admin-config"
              title="Regional Educational Offices"
              description="Manage apex regional administrative zones and institutional oversight."
              actionButtonText="+ Add Regional Office"
              onAction={() => alert('Add Region Triggered')}
            />
          </div>
        );

      case 'AdminBreadcrumb':
      case 'BreadcrumbMenu':
        return (
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span>Administration Config</span>
              <span className="text-slate-400">/</span>
              <span>Organization Setup</span>
              <span className="text-slate-400">/</span>
              <span className="text-slate-900 dark:text-white font-bold">Regional Offices</span>
            </div>
            <span className="text-xs text-slate-500">Hierarchical Navigation Breadcrumb Trail</span>
          </div>
        );

      case 'PageTitle':
        return (
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Regional Educational Offices</h1>
            <span className="text-xs text-slate-500">Page Headline (text-2xl font-black text-slate-900)</span>
          </div>
        );

      case 'PageDescription':
        return (
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs text-slate-500 max-w-md text-center">Manage apex regional administrative zones and institutional oversight across all affiliated provinces.</p>
            <span className="text-xs text-slate-400">Sub-heading contextual description (text-xs text-slate-500)</span>
          </div>
        );

      case 'FavoriteButton':
        return (
          <div className="flex flex-col items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-amber-300 bg-amber-50 text-amber-800 shadow-2xs">
              <span className="text-amber-500">★</span> Favorite
            </button>
            <span className="text-xs text-slate-500">Pin page to user dashboard</span>
          </div>
        );

      case 'QuickActionButton':
        return (
          <div className="flex flex-col items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-blue-300 bg-blue-50 text-blue-800 shadow-2xs">
              <span>⚡</span> In Quick Actions
            </button>
            <span className="text-xs text-slate-500">Pin shortcut to top utility toolbar</span>
          </div>
        );

      case 'PrimaryActionButton':
        return (
          <div className="flex flex-col items-center gap-3">
            <PrimaryActionButton
              label="+ Add School"
              disabled={activeState === 'disabled'}
              isLoading={activeState === 'loading'}
              onClick={() => alert('+ Add School Clicked')}
            />
            <span className="text-xs text-slate-500">Canonical Enterprise Add Entity Button (+ Add &lt;Entity&gt;)</span>
          </div>
        );

      case 'PageActions':
        return (
          <div className="flex items-center gap-2 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <button className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700">Export CSV</button>
            <PrimaryActionButton label="+ Add Record" onClick={() => {}} />
          </div>
        );

      // ═════════════════════════════════════════════════════════════════════
      // 04. TABS & NAVIGATION
      // ═════════════════════════════════════════════
      case 'AdminModuleTabs':
        return (
          <div className="w-full">
            <AdminModuleTabs
              tabs={[
                { id: 'ho', label: 'Head Offices', icon: '🏛️', count: 2, href: '#' },
                { id: 'ro', label: 'Regional Offices', icon: '🌐', count: 4, href: '#', active: true },
                { id: 'sch', label: 'Schools', icon: '🏫', count: 12, href: '#' },
                { id: 'br', label: 'Branches', icon: '📍', count: 28, href: '#' },
              ]}
            />
          </div>
        );

      case 'AdminSubTabs':
        return (
          <div className="flex flex-col items-center gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Admin SubTabs / Segmented Control (Interactive)</span>
            <div className="inline-flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              {[
                { id: 'overview', label: 'Overview', count: null },
                { id: 'campuses', label: 'Affiliated Campuses', count: 4 },
                { id: 'staff', label: 'Assigned Staff', count: 28 },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeSubTab === tab.id
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count !== null && <span className="ml-1 text-[10px] opacity-75 font-mono">({tab.count})</span>}
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-400">Current Tab: <code className="font-mono text-indigo-600 font-bold">{activeSubTab}</code></span>
          </div>
        );

      // ═════════════════════════════════════════════════════════════════════
      // 05. CARDS & SUMMARY
      // ═════════════════════════════════════════════
      case 'AdminCard':
        return (
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm text-left space-y-2 max-w-md w-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Admin Card / Section Card</span>
              <StatusBadge status="ACTIVE" />
            </div>
            <p className="text-xs text-slate-500">White elevated container with subtle border, 16px radius, and card elevation shadow.</p>
          </div>
        );

      case 'StatCard':
        return (
          <div className="space-y-3 w-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Stat Card / KPI Card / Metric Card (Consolidated Standard)</span>
              <span className="text-[10px] font-mono text-slate-400">Aliases: KpiCard, MetricCard</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
              <StatCard label="Total Schools" value="42" icon={<School className="w-5 h-5 text-indigo-600" />} trend="+12% vs last term" variant="primary" />
              <StatCard label="Active Campuses" value="128" icon={<Building2 className="w-5 h-5 text-emerald-600" />} trend="+4 new this month" variant="success" />
              <StatCard label="Pending Verifications" value="3" icon={<Clock className="w-5 h-5 text-amber-600" />} trend="Action required" variant="warning" />
            </div>
          </div>
        );

      case 'ClickableCard':
        return (
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-md hover:border-indigo-300 transition-all text-left space-y-2 max-w-md w-full cursor-pointer">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Interactive Clickable Card</span>
              <ArrowRight className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-xs text-slate-500">Hover elevation with interactive click navigation.</p>
          </div>
        );

      case 'RecordSummary':
        return (
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-left space-y-1 text-xs w-full max-w-sm">
            <div className="font-bold text-slate-900 dark:text-white">Beacon Horizon Public School (SCH-0042)</div>
            <div className="text-slate-500">Affiliated to Sindh South Region • 3 Connected Branches</div>
          </div>
        );

      case 'InfoCard':
        return (
          <div className="p-4 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-800 text-left text-xs text-blue-900 dark:text-blue-200 space-y-1 w-full max-w-md">
            <div className="font-bold">Configuration Notice</div>
            <div>All changes made to regional boundaries will propagate automatically to affiliated school records.</div>
          </div>
        );

      case 'EmptyCard':
        return (
          <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center text-xs text-slate-400 w-full max-w-sm">
            Empty Card Container Placeholder
          </div>
        );

      // ═════════════════════════════════════════════════════════════════════
      // 06. TABLES
      // ═════════════════════════════════════════════
      case 'AdminTable':
        return (
          <div className="space-y-2 w-full">
            <AdminTable density={tableDensity}>
              <AdminTableHead>
                <AdminTableRow>
                  <AdminTableTh>School Name & Code</AdminTableTh>
                  <AdminTableTh>Affiliated Region</AdminTableTh>
                  <AdminTableTh>Connected Campuses</AdminTableTh>
                  <AdminTableTh>Status</AdminTableTh>
                  <AdminTableTh align="right">Actions</AdminTableTh>
                </AdminTableRow>
              </AdminTableHead>
              <AdminTableBody>
                <AdminTableRow>
                  <AdminTableTd>
                    <div className="font-bold text-slate-900 dark:text-white">Beacon Horizon Public School</div>
                    <div className="text-[10px] text-slate-400 font-mono">SCH-0042</div>
                  </AdminTableTd>
                  <AdminTableTd>Sindh South Regional Office</AdminTableTd>
                  <AdminTableTd><ConnectedCountPill count={3} label="3 Branches" onClick={() => {}} /></AdminTableTd>
                  <AdminTableTd><StatusBadge status="ACTIVE" /></AdminTableTd>
                  <AdminTableTd align="right"><RowActions onView={() => {}} onEdit={() => {}} onDelete={() => {}} /></AdminTableTd>
                </AdminTableRow>
              </AdminTableBody>
            </AdminTable>
          </div>
        );

      case 'TableHeader':
        return (
          <div className="w-full space-y-2 text-left">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">TableHeader (Static Header Row Only)</span>
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800/80">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="px-4 py-3 font-extrabold uppercase text-[11px] text-slate-700 tracking-wider">Entity Name & Code</th>
                    <th className="px-4 py-3 font-extrabold uppercase text-[11px] text-slate-700 tracking-wider">Affiliated Region</th>
                    <th className="px-4 py-3 font-extrabold uppercase text-[11px] text-slate-700 tracking-wider">Status</th>
                    <th className="px-4 py-3 font-extrabold uppercase text-[11px] text-slate-700 tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
              </table>
            </div>
          </div>
        );

      case 'StickyTableHeader':
        return (
          <div className="w-full space-y-2 text-left">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">StickyTableHeader (Scroll Below To Test Sticky Pinning)</span>
              <span className="text-[10px] text-indigo-600 font-bold">Fixed Height 180px Scroll Container</span>
            </div>
            <div className="h-[180px] overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 relative shadow-inner">
              <table className="w-full text-xs text-left">
                <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 z-10 shadow-xs border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5 font-black uppercase text-[10px] text-slate-700 dark:text-slate-200 tracking-wider">School Code</th>
                    <th className="px-4 py-2.5 font-black uppercase text-[10px] text-slate-700 dark:text-slate-200 tracking-wider">Campus Name</th>
                    <th className="px-4 py-2.5 font-black uppercase text-[10px] text-slate-700 dark:text-slate-200 tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-2 font-mono text-[11px] text-slate-500">SCH-00{idx}</td>
                      <td className="px-4 py-2 font-semibold text-slate-800 dark:text-slate-200">Campus Branch #{idx} (Clifton Zone)</td>
                      <td className="px-4 py-2"><StatusBadge status={idx % 2 === 0 ? 'ACTIVE' : 'PENDING'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'ResponsiveTable':
        return (
          <div className="w-full space-y-2 text-left">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">ResponsiveTable (Horizontally Scrollable Container)</span>
            <div className="w-full overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900">
              <table className="w-[800px] text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 font-bold">Code</th>
                    <th className="px-4 py-3 font-bold">Name</th>
                    <th className="px-4 py-3 font-bold">Board</th>
                    <th className="px-4 py-3 font-bold">Principal</th>
                    <th className="px-4 py-3 font-bold">City</th>
                    <th className="px-4 py-3 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="px-4 py-3 font-mono">SCH-0042</td>
                    <td className="px-4 py-3 font-bold">Beacon Horizon Campus</td>
                    <td className="px-4 py-3">Cambridge CIE</td>
                    <td className="px-4 py-3">Dr. M. Tariq</td>
                    <td className="px-4 py-3">Karachi</td>
                    <td className="px-4 py-3"><StatusBadge status="ACTIVE" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'TableRow':
        return (
          <div className="w-full space-y-2 text-left">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">TableRow (One Row in Isolation)</span>
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
              <table className="w-full text-xs text-left">
                <tbody>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 dark:text-white">Beacon Horizon Clifton Campus</div>
                      <div className="text-[10px] text-slate-400 font-mono">BR-0091</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">Sindh South</td>
                    <td className="px-4 py-3"><StatusBadge status="ACTIVE" /></td>
                    <td className="px-4 py-3 text-right"><RowActions onView={() => {}} onEdit={() => {}} onDelete={() => {}} /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'TableCell':
        return (
          <div className="flex flex-col items-center gap-3 w-full">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Representative Table Cell Types</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full text-center">
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 text-xs">
                <span className="font-bold text-slate-800">Primary Entity Cell</span>
                <div className="text-[10px] text-slate-400 font-mono">SCH-0042</div>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 text-xs">
                <span className="font-bold text-slate-800">Relationship Cell</span>
                <div className="mt-1"><ConnectedCountPill count={3} label="3 Units" /></div>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 text-xs">
                <span className="font-bold text-slate-800">Status Cell</span>
                <div className="mt-1"><StatusBadge status="ACTIVE" /></div>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 text-xs">
                <span className="font-bold text-slate-800">Action Cell</span>
                <div className="mt-1 flex justify-center"><RowActions onView={() => {}} onEdit={() => {}} onDelete={() => {}} /></div>
              </div>
            </div>
          </div>
        );

      case 'SortControl':
        return (
          <div className="flex flex-col items-center gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">SortControl (Interactive Click to Toggle)</span>
            <button
              onClick={() => setSortState(sortState === 'asc' ? 'desc' : sortState === 'desc' ? 'none' : 'asc')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-2xs cursor-pointer hover:border-indigo-300"
            >
              <span>School Name</span>
              {sortState === 'asc' && <ChevronUp className="w-4 h-4 text-indigo-600 stroke-[2.5]" />}
              {sortState === 'desc' && <ChevronDown className="w-4 h-4 text-indigo-600 stroke-[2.5]" />}
              {sortState === 'none' && <ChevronsUpDown className="w-4 h-4 text-slate-400" />}
            </button>
            <span className="text-xs text-slate-400">Current Sort State: <code className="font-mono text-indigo-600 font-bold">{sortState.toUpperCase()}</code></span>
          </div>
        );

      case 'BulkSelection':
        return (
          <div className="flex flex-col items-center gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">BulkSelection Controls</span>
            <div className="flex items-center gap-4 p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs shadow-2xs">
              <Checkbox label="Header Select All" checked={checkboxChecked} onChange={(e) => setCheckboxChecked(e.target.checked)} />
              <div className="h-4 w-px bg-slate-200" />
              <span className="text-slate-600 font-medium">3 of 28 records selected</span>
            </div>
          </div>
        );

      case 'TableDensity':
        return (
          <div className="flex flex-col items-center gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Table Density Switcher</span>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              {(['compact', 'normal', 'comfortable'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setTableDensity(d)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                    tableDensity === d ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-2xs font-bold' : 'text-slate-600'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        );

      case 'TableFooter':
        return (
          <div className="w-full p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between">
            <span className="font-semibold text-slate-600 dark:text-slate-300">Total: 42 Registered Schools</span>
            <span className="text-slate-400">Page 1 of 4</span>
          </div>
        );

      // ═════════════════════════════════════════════════════════════════════
      // 07. ROW ACTIONS
      // ═════════════════════════════════════════════
      case 'RowActions':
        return (
          <div className="flex flex-col items-center gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Complete RowActions Button Group</span>
            <RowActions>
              <ViewAction onClick={() => alert('View')} />
              <EditAction onClick={() => alert('Edit')} />
              <StatusAction status="ACTIVE" onClick={() => alert('Status')} />
              <DeleteAction onClick={() => alert('Delete')} />
              <MoreActionsMenu onClick={() => alert('More Options')} />
            </RowActions>
            <span className="text-xs text-slate-400">Canonical Order: View (Blue) → Edit (Emerald) → Status (Pill) → Delete (Rose) → More (Slate)</span>
          </div>
        );

      case 'ViewAction':
        return (
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">View Action Button Only</span>
            <ViewAction onClick={() => alert('View Clicked')} disabled={activeState === 'disabled'} />
            <span className="text-xs text-slate-500">Eye Icon • Blue #2563eb</span>
          </div>
        );

      case 'EditAction':
        return (
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Edit Action Button Only</span>
            <EditAction onClick={() => alert('Edit Clicked')} disabled={activeState === 'disabled'} />
            <span className="text-xs text-slate-500">Pencil Icon • Emerald #059669</span>
          </div>
        );

      case 'DeleteAction':
        return (
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Delete Action Button Only</span>
            <DeleteAction onClick={() => alert('Delete Clicked')} disabled={activeState === 'disabled'} />
            <span className="text-xs text-slate-500">Trash Icon • Rose #e11d48</span>
          </div>
        );

      case 'StatusAction':
        return (
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status Toggle Action</span>
            <StatusAction status="ACTIVE" onClick={() => alert('Status Action Clicked')} />
            <span className="text-xs text-slate-500">Deactivate / Activate Action Button</span>
          </div>
        );

      case 'ButtonGroup':
        return (
          <div className="inline-flex rounded-lg shadow-2xs border border-slate-200 overflow-hidden">
            <button className="px-3 py-1.5 bg-white text-xs font-semibold text-slate-700 border-r border-slate-200">Left</button>
            <button className="px-3 py-1.5 bg-white text-xs font-semibold text-slate-700 border-r border-slate-200">Middle</button>
            <button className="px-3 py-1.5 bg-white text-xs font-semibold text-slate-700">Right</button>
          </div>
        );

      // ═════════════════════════════════════════════════════════════════════
      // 08. CONNECTED UNITS / RELATIONSHIPS
      // ═════════════════════════════════════════════
      case 'ConnectedCountPill':
        return (
          <div className="flex flex-col items-center gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Connected Count Pill / Relationship Badge (Consolidated)</span>
            <div className="flex items-center gap-3">
              <ConnectedCountPill count={3} label="3 Campuses" onClick={() => alert('3 Campuses')} />
              <ConnectedCountPill count={12} label="12 Staff" onClick={() => alert('12 Staff')} />
            </div>
          </div>
        );

      case 'ConnectedUnitsModal':
        return <ConnectedUnitsModalDemo />;

      case 'EntityListItem':
        return (
          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 text-left text-xs flex items-center justify-between w-full max-w-sm">
            <div className="font-bold text-slate-800">Clifton Campus Branch</div>
            <StatusBadge status="ACTIVE" />
          </div>
        );

      case 'HierarchyLink':
        return (
          <div className="flex items-center gap-1.5 text-xs text-indigo-600 bg-indigo-50 p-2.5 rounded-xl border border-indigo-200 font-semibold">
            <span>Sindh South Region</span>
            <ArrowRight className="w-3.5 h-3.5" />
            <span>Beacon Horizon School</span>
          </div>
        );

      // ═════════════════════════════════════════════════════════════════════
      // 09. SEARCH / FILTERS / PAGINATION
      // ═════════════════════════════════════════════
      case 'AdminSearch':
        return (
          <div className="w-full max-w-sm mx-auto space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block text-center">AdminSearch Input Only</span>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search records by code, name, or city..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs shadow-2xs focus:ring-2 focus:ring-indigo-500/30 focus:outline-none"
              />
            </div>
          </div>
        );

      case 'AdminFilterBar':
        return (
          <div className="w-full">
            <AdminFilterBar
              categories={['All Types', 'Primary School', 'Secondary School', 'College']}
              placeholder="Search by school name, registration code..."
            />
          </div>
        );

      case 'FilterSelect':
      case 'StatusFilter':
        return (
          <div className="w-48 mx-auto">
            <SelectField
              options={[
                { label: 'All Statuses', value: 'all' },
                { label: 'Active', value: 'active' },
                { label: 'Inactive', value: 'inactive' },
                { label: 'Pending', value: 'pending' },
              ]}
            />
          </div>
        );

      case 'FilterChip':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <span>Status: Active</span>
            <button className="hover:text-indigo-900"><X className="w-3.5 h-3.5" /></button>
          </div>
        );

      case 'ClearFilters':
        return (
          <button className="px-3 py-1.5 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200">
            Clear All Filters
          </button>
        );

      case 'AdminPagination':
      case 'PageSizeSelector':
      case 'RecordsCounter':
        return (
          <div className="flex items-center justify-between w-full max-w-lg p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 text-xs">
            <span className="text-slate-500">Showing 1 to 10 of 42 entries</span>
            <div className="flex items-center gap-1">
              <button className="px-2.5 py-1 rounded border border-slate-200 text-slate-600 font-semibold">Prev</button>
              <button className="px-2.5 py-1 rounded bg-indigo-600 text-white font-bold">1</button>
              <button className="px-2.5 py-1 rounded border border-slate-200 text-slate-600 font-semibold">2</button>
              <button className="px-2.5 py-1 rounded border border-slate-200 text-slate-600 font-semibold">Next</button>
            </div>
          </div>
        );

      // ═════════════════════════════════════════════════════════════════════
      // 10. BUTTONS (EXACT SUBJECT PREVIEWS)
      // ═════════════════════════════════════════════
      case 'Button':
        return (
          <div className="flex flex-col items-center gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Button Base Family</span>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="danger">Danger</Button>
            </div>
          </div>
        );

      case 'PrimaryButton':
        return (
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Primary Button Only</span>
            <Button variant="primary" disabled={activeState === 'disabled'}>Primary Action</Button>
            <span className="text-xs text-slate-500">Solid Indigo-600 with Focus Ring</span>
          </div>
        );

      case 'SecondaryButton':
        return (
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Secondary Button Only</span>
            <Button variant="secondary" disabled={activeState === 'disabled'}>Secondary Action</Button>
            <span className="text-xs text-slate-500">Slate-100 Neutral Action</span>
          </div>
        );

      case 'OutlineButton':
        return (
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Outline Button Only</span>
            <Button variant="outline" disabled={activeState === 'disabled'}>Outline Action</Button>
            <span className="text-xs text-slate-500">Bordered Transparent Action</span>
          </div>
        );

      case 'DangerButton':
        return (
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Danger Button Only</span>
            <Button variant="danger" disabled={activeState === 'disabled'}>Delete Record</Button>
            <span className="text-xs text-slate-500">Rose-600 Destructive Action</span>
          </div>
        );

      case 'IconButton':
        return (
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Icon Button Only</span>
            <button className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300 shadow-2xs cursor-pointer" title="Search Action">
              <Search className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-500">Square Icon Button (38px)</span>
          </div>
        );

      case 'LoadingButton':
        return (
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loading Button Only</span>
            <Button variant="primary" isLoading={true}>Saving Changes...</Button>
            <span className="text-xs text-slate-500">Integrated Animated Circular Spinner</span>
          </div>
        );

      case 'DisabledButton':
        return (
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Disabled Button Only</span>
            <Button variant="primary" disabled={true}>Disabled Action</Button>
            <span className="text-xs text-slate-500">Muted Opacity & Not-Allowed Cursor</span>
          </div>
        );

      case 'ExternalLink':
        return (
          <a href="#" className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline">
            <span>View Board Accreditation</span>
            <ExtIcon className="w-3.5 h-3.5" />
          </a>
        );

      // ═════════════════════════════════════════════════════════════════════
      // 11. FORMS — STRUCTURE
      // ═════════════════════════════════════════════
      case 'AdminFormModal':
        return (
          <div className="text-center space-y-3">
            <Button variant="primary" onClick={() => setInteractiveModalOpen(true)}>Launch 5xl Form Modal Preview</Button>
            {interactiveModalOpen && (
              <AdminModal isOpen={true} onClose={() => setInteractiveModalOpen(false)} title="Create Educational Institution" subtitle="Enter registration details to register a new school." maxWidth="5xl">
                <div className="p-4 space-y-4">
                  <FormGrid cols={2}>
                    <FormField label="School Code" required><TextInput defaultValue="SCH-0042" /></FormField>
                    <FormField label="School Name" required><TextInput defaultValue="Beacon Horizon School" /></FormField>
                  </FormGrid>
                </div>
              </AdminModal>
            )}
          </div>
        );

      case 'FormContainer':
        return (
          <div className="w-full p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 text-left space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Form Container Boundary</span>
            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-indigo-400 text-xs font-semibold text-indigo-700">
              Form Validation & Submission Container Slot
            </div>
          </div>
        );

      case 'FormSection':
        return (
          <div className="w-full text-left">
            <FormSection title="Institution Identity" description="Basic school details and classification parameters">
              <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500">Section Content Fields Slot</div>
            </FormSection>
          </div>
        );

      case 'FormGrid':
        return (
          <div className="w-full space-y-2 text-left">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">FormGrid (2-Column Responsive Layout)</span>
            <FormGrid cols={2}>
              <div className="p-4 rounded-xl border border-dashed border-indigo-400 bg-indigo-50/40 text-xs font-bold text-indigo-700 text-center">Column 1 Field Slot</div>
              <div className="p-4 rounded-xl border border-dashed border-indigo-400 bg-indigo-50/40 text-xs font-bold text-indigo-700 text-center">Column 2 Field Slot</div>
            </FormGrid>
          </div>
        );

      case 'FormField':
        return (
          <div className="w-full max-w-sm mx-auto text-left">
            <FormField label="Institution Full Name" required helpText="Official registered school name e.g. Beacon Horizon">
              <TextInput defaultValue="Beacon Horizon Clifton Campus" />
            </FormField>
          </div>
        );

      case 'FormLabel':
        return (
          <div className="space-y-2 text-left">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">FormLabel Standards</span>
            <div className="space-y-1 text-xs">
              <div className="font-semibold text-slate-700">Standard Field Label</div>
              <div className="font-semibold text-slate-700">Required Field Label <span className="text-rose-500 font-bold">*</span></div>
              <div className="font-semibold text-slate-500">Optional Field Label <span className="text-slate-400 font-normal">(Optional)</span></div>
            </div>
          </div>
        );

      case 'FormHelpText':
        return (
          <div className="text-left space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">FormHelpText</span>
            <p className="text-[11px] text-slate-500">Must be a unique 6-character code e.g. SCH-001</p>
          </div>
        );

      case 'FieldError':
        return (
          <div className="w-full max-w-sm mx-auto text-left space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">FieldError Highlight State</span>
            <TextInput isError={true} defaultValue="INVALID_CODE_12345" />
            <div className="text-[11px] font-semibold text-rose-600 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>School registration code already exists in this regional zone.</span>
            </div>
          </div>
        );

      case 'FieldState':
        return (
          <div className="grid grid-cols-2 gap-3 w-full max-w-md text-left text-xs">
            <div><span className="font-bold text-slate-700 block mb-1">Normal</span><TextInput defaultValue="Standard Input" /></div>
            <div><span className="font-bold text-slate-700 block mb-1">Focused</span><TextInput className="ring-2 ring-indigo-500/30 border-indigo-500" defaultValue="Focused Input" /></div>
            <div><span className="font-bold text-rose-600 block mb-1">Error</span><TextInput isError={true} defaultValue="Error State" /></div>
            <div><span className="font-bold text-slate-400 block mb-1">Disabled</span><TextInput disabled={true} defaultValue="Disabled Input" /></div>
          </div>
        );

      case 'FormFooter':
      case 'StickyActionBar':
        return (
          <div className="w-full p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 shadow-sm flex items-center justify-end gap-2">
            <Button variant="secondary">Cancel</Button>
            <Button variant="primary">Save Changes</Button>
          </div>
        );

      // ═════════════════════════════════════════════════════════════════════
      // 12. FORM CONTROLS
      // ═════════════════════════════════════════════
      case 'TextInput':
        return (
          <div className="w-full max-w-sm mx-auto space-y-2 text-left">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block text-center">TextInput Only</span>
            <TextInput
              value={textInputValue}
              onChange={(e) => setTextInputValue(e.target.value)}
              placeholder="Enter institutional name..."
              disabled={activeState === 'disabled'}
            />
          </div>
        );

      case 'NumberInput':
        return (
          <div className="w-48 mx-auto text-left space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block text-center">NumberInput</span>
            <input type="number" defaultValue="42" className="w-full px-3 py-2 rounded-lg text-xs border border-slate-200 bg-white" />
          </div>
        );

      case 'PasswordField':
        return (
          <div className="w-full max-w-sm mx-auto text-left space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block text-center">PasswordField with Toggle</span>
            <div className="relative">
              <TextInput type={showPassword ? 'text' : 'password'} defaultValue="SuperSecretPassword123" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <Eye className="w-4 h-4 text-indigo-600" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        );

      case 'PhoneInput':
        return (
          <div className="w-full max-w-sm mx-auto text-left space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block text-center">PhoneInput</span>
            <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs">
              <span className="px-3 py-2 bg-slate-100 font-bold text-slate-600 border-r border-slate-200">+92</span>
              <input type="tel" defaultValue="300 1234567" className="w-full px-3 py-2 outline-none" />
            </div>
          </div>
        );

      case 'EmailInput':
        return (
          <div className="w-full max-w-sm mx-auto text-left space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block text-center">EmailInput</span>
            <input type="email" defaultValue="admin@campus.edu" className="w-full px-3 py-2 rounded-lg text-xs border border-slate-200" />
          </div>
        );

      case 'TextArea':
        return (
          <div className="w-full max-w-sm mx-auto text-left space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block text-center">TextArea</span>
            <textarea rows={3} defaultValue="Institutional campus remarks..." className="w-full p-3 rounded-lg text-xs border border-slate-200" />
          </div>
        );

      case 'SelectField':
        return (
          <div className="w-full max-w-sm mx-auto space-y-2 text-left">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block text-center">SelectField Only</span>
            <SelectField
              value={selectedDropdownOption}
              onChange={(e) => setSelectedDropdownOption(e.target.value)}
              options={[
                { label: 'Primary (Grades 1-5)', value: 'primary' },
                { label: 'Middle (Grades 6-8)', value: 'middle' },
                { label: 'Secondary (Grades 9-10)', value: 'secondary' },
              ]}
              disabled={activeState === 'disabled'}
            />
          </div>
        );

      case 'MultiSelect':
        return (
          <div className="w-full max-w-md mx-auto text-left space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Enterprise MultiSelect (Interactive)
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {multiSelectValue.length} items selected
              </span>
            </div>
            <MultiSelect
              label="Select Affiliated Campuses"
              placeholder="Choose branches..."
              value={multiSelectValue}
              onChange={setMultiSelectValue}
              disabled={activeState === 'disabled'}
              isLoading={activeState === 'loading'}
              isError={activeState === 'error'}
              errorMessage={activeState === 'error' ? 'At least 2 campus units must be selected.' : undefined}
              options={[
                { value: 'clifton', label: 'Clifton Campus', sublabel: 'South Region • Karachi (BR-0091)' },
                { value: 'dha', label: 'DHA Campus', sublabel: 'South Region • Karachi (BR-0092)' },
                { value: 'gulshan', label: 'Gulshan Campus', sublabel: 'East Region • Karachi (BR-0093)' },
                { value: 'north_nazimabad', label: 'North Nazimabad Campus', sublabel: 'Central Region • Karachi (BR-0094)' },
                { value: 'pechs', label: 'PECHS Campus', sublabel: 'South Region • Karachi (BR-0095)' },
                { value: 'malir', label: 'Malir Campus', sublabel: 'East Region • Karachi (BR-0096)' },
                { value: 'islamabad_f8', label: 'Islamabad F-8 Campus', sublabel: 'Capital Region • Islamabad (BR-0097)' },
                { value: 'lahore_gulberg', label: 'Lahore Gulberg Campus', sublabel: 'Central Punjab • Lahore (BR-0098)' },
              ]}
            />
          </div>
        );

      case 'HierarchyPicker':
        return (
          <div className="w-full max-w-md mx-auto text-left space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block text-center">Hierarchy Picker / Tree Select (Consolidated)</span>
            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 text-xs space-y-2">
              <div className="font-bold text-slate-800">Target Campus Scope:</div>
              <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold flex items-center justify-between">
                <span>Beacon Horizon Clifton Campus (BR-0091)</span>
                <span className="text-[10px] font-mono uppercase bg-indigo-200 px-1.5 py-0.5 rounded">Selected</span>
              </div>
            </div>
          </div>
        );

      case 'Checkbox':
        return (
          <div className="flex flex-col items-center gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Checkbox States</span>
            <div className="flex flex-col gap-2 text-left">
              <Checkbox label="Checked State" checked={checkboxChecked} onChange={(e) => setCheckboxChecked(e.target.checked)} />
              <Checkbox label="Unchecked State" checked={!checkboxChecked} onChange={(e) => setCheckboxChecked(!e.target.checked)} />
              <Checkbox label="Disabled State" checked={true} disabled={true} />
            </div>
          </div>
        );

      case 'RadioGroup':
        return (
          <div className="flex flex-col items-center gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">RadioGroup Options</span>
            <div className="flex flex-col gap-2 text-left text-xs font-semibold text-slate-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="board" checked={selectedRadio === 'cambridge'} onChange={() => setSelectedRadio('cambridge')} />
                <span>Cambridge International (CIE)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="board" checked={selectedRadio === 'fbise'} onChange={() => setSelectedRadio('fbise')} />
                <span>Federal Board (FBISE)</span>
              </label>
            </div>
          </div>
        );

      case 'ToggleSwitch':
        return (
          <div className="flex flex-col items-center gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">ToggleSwitch (Interactive Click)</span>
            <ToggleSwitch
              label={`Active Status: ${toggleChecked ? 'Enabled' : 'Disabled'}`}
              checked={toggleChecked}
              onChange={(e) => setToggleChecked(e.target.checked)}
              disabled={activeState === 'disabled'}
            />
          </div>
        );

      case 'InputGroup':
        return (
          <div className="w-full max-w-sm mx-auto text-left space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block text-center">InputGroup with Addons</span>
            <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs">
              <span className="px-3 py-2 bg-slate-100 font-semibold text-slate-600 border-r border-slate-200">https://</span>
              <input type="text" defaultValue="campus.edu/portal" className="w-full px-3 py-2 outline-none" />
              <span className="px-3 py-2 bg-slate-100 font-semibold text-slate-600 border-l border-slate-200">.pk</span>
            </div>
          </div>
        );

      // ═════════════════════════════════════════════════════════════════════
      // 13. FILES / IMAGES
      // ═════════════════════════════════════════════
      case 'ImagePreview':
      case 'EntityLogo':
      case 'Avatar':
        return <EntityLogoDemo />;

      // ═════════════════════════════════════════════════════════════════════
      // 14. MODALS / POPUPS / OVERLAYS
      // ═════════════════════════════════════════════
      case 'AdminModal':
      case 'SmallModal':
      case 'MediumModal':
      case 'WideModal':
      case 'ConfirmModal':
      case 'DeleteConfirmModal':
        return (
          <div className="text-center space-y-3">
            <Button variant="primary" onClick={() => setInteractiveModalOpen(true)}>Open Modal Dialog Preview</Button>
            {interactiveModalOpen && (
              <AdminModal isOpen={true} onClose={() => setInteractiveModalOpen(false)} title="Confirmation Prompt" subtitle="Review changes before applying." maxWidth="md">
                <div className="p-4 text-xs text-slate-600">Standard confirmation modal content.</div>
              </AdminModal>
            )}
          </div>
        );

      case 'ModalOverlay':
        return (
          <div className="p-6 rounded-2xl border border-slate-200 bg-slate-900/60 text-white text-center space-y-2 w-full max-w-md">
            <div className="text-xs font-bold">ModalOverlay (bg-slate-900/60 backdrop-blur-xs)</div>
            <p className="text-xs text-slate-300">Provides high-contrast backdrop layer at zIndex 90/100.</p>
          </div>
        );

      case 'ModalHeader':
        return (
          <div className="w-full max-w-md p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between text-left">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Create Educational Institution</h3>
              <p className="text-[11px] text-slate-500">Enter registration details to register entity.</p>
            </div>
            <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
          </div>
        );

      case 'ModalBody':
        return (
          <div className="w-full max-w-md p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 text-xs text-slate-600 text-left">
            ModalBody Content Container (p-6, max-h-[80vh], overflow-y-auto)
          </div>
        );

      case 'ModalFooter':
        return (
          <div className="w-full max-w-md p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 shadow-sm flex justify-end gap-2">
            <Button variant="secondary">Cancel</Button>
            <Button variant="primary">Confirm Action</Button>
          </div>
        );

      case 'ModalClose':
        return (
          <div className="flex flex-col items-center gap-2">
            <button className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 border border-slate-200 shadow-2xs">
              <X className="w-5 h-5" />
            </button>
            <span className="text-xs text-slate-500">Modal Dismiss "X" Button</span>
          </div>
        );

      case 'NestedModal':
        return (
          <div className="text-center space-y-3">
            <Button variant="primary" onClick={() => setNestedModalOpen(true)}>Launch Parent & Nested Modal Stacking</Button>
            {nestedModalOpen && (
              <AdminModal isOpen={true} onClose={() => setNestedModalOpen(false)} title="Parent Modal (zIndex: 100)" maxWidth="5xl">
                <div className="p-4 text-center space-y-3">
                  <p className="text-xs text-slate-600">Parent modal window active.</p>
                  <ConnectedUnitsModalDemo />
                </div>
              </AdminModal>
            )}
          </div>
        );

      // ═════════════════════════════════════════════════════════════════════
      // 15. VIEW DETAILS
      // ═════════════════════════════════════════════
      case 'DetailsHeader':
      case 'EntityIdentityCard':
      case 'DetailsSection':
      case 'DetailsGrid':
      case 'DetailsField':
      case 'SocialLink':
      case 'LinkedAccountCard':
      case 'HierarchyDetails':
        return <DetailsLayoutDemo />;

      // ═════════════════════════════════════════════════════════════════════
      // 16. STATUS / BADGES / TAGS
      // ═════════════════════════════════════════════
      case 'StatusBadge':
        return (
          <div className="flex flex-wrap items-center justify-center gap-2">
            <StatusBadge status="ACTIVE" />
            <StatusBadge status="INACTIVE" />
            <StatusBadge status="PENDING" />
            <StatusBadge status="APPROVED" />
            <StatusBadge status="REJECTED" />
            <StatusBadge status="DRAFT" />
            <StatusBadge status="ARCHIVED" />
            <StatusBadge status="SUSPENDED" />
          </div>
        );

      case 'ActiveBadge':
        return <div className="flex flex-col items-center gap-2"><StatusBadge status="ACTIVE" /><span className="text-xs text-slate-500">Active Operational Status</span></div>;

      case 'InactiveBadge':
        return <div className="flex flex-col items-center gap-2"><StatusBadge status="INACTIVE" /><span className="text-xs text-slate-500">Inactive Deactivated Status</span></div>;

      case 'PendingBadge':
        return <div className="flex flex-col items-center gap-2"><StatusBadge status="PENDING" /><span className="text-xs text-slate-500">Pending Approval Status</span></div>;

      case 'ApprovedBadge':
        return <div className="flex flex-col items-center gap-2"><StatusBadge status="APPROVED" /><span className="text-xs text-slate-500">Verified & Approved Status</span></div>;

      case 'RejectedBadge':
        return <div className="flex flex-col items-center gap-2"><StatusBadge status="REJECTED" /><span className="text-xs text-slate-500">Rejected Submission Status</span></div>;

      case 'DraftBadge':
        return <div className="flex flex-col items-center gap-2"><StatusBadge status="DRAFT" /><span className="text-xs text-slate-500">Unpublished Draft Status</span></div>;

      case 'ArchivedBadge':
        return <div className="flex flex-col items-center gap-2"><StatusBadge status="ARCHIVED" /><span className="text-xs text-slate-500">Historical Archived Status</span></div>;

      case 'Badge':
      case 'Tag':
      case 'PermissionState':
        return (
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">SuperAdmin</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">Read & Write</span>
          </div>
        );

      // ═════════════════════════════════════════════════════════════════════
      // 17. FEEDBACK / MESSAGES
      // ═════════════════════════════════════════════
      case 'Alert':
        return (
          <div className="space-y-2 w-full max-w-md text-left">
            <Alert variant="info" title="System Notice">Centralized design tokens are active across this workspace.</Alert>
          </div>
        );

      case 'SuccessAlert':
        return (
          <div className="w-full max-w-md text-left">
            <Alert variant="success" title="Success">Record successfully synchronized with Head Office hierarchy.</Alert>
          </div>
        );

      case 'ErrorAlert':
        return (
          <div className="w-full max-w-md text-left">
            <Alert variant="error" title="Validation Error">School code must be unique within current regional territory.</Alert>
          </div>
        );

      case 'WarningAlert':
        return (
          <div className="w-full max-w-md text-left">
            <Alert variant="warning" title="Pending Action">Regional office requires at least 2 school affiliations before activation.</Alert>
          </div>
        );

      case 'InfoAlert':
        return (
          <div className="w-full max-w-md text-left">
            <Alert variant="info" title="System Notice">Design system tokens are mapped to canonical shared components.</Alert>
          </div>
        );

      case 'Toast':
        return (
          <div className="p-3.5 bg-slate-900 text-white rounded-xl shadow-xl text-xs flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Regional Office successfully updated.</span>
          </div>
        );

      case 'ValidationMessage':
        return (
          <div className="text-xs text-rose-600 font-semibold flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Please enter a valid institutional registration number.</span>
          </div>
        );

      // ═════════════════════════════════════════════════════════════════════
      // 18. LOADING / EMPTY / ERROR STATES
      // ═════════════════════════════════════════════
      case 'EmptyState':
        return (
          <EmptyState
            icon="📂"
            title="No Affiliated Campuses Found"
            description="This school institution does not have any secondary branch units registered yet."
            action={<Button variant="primary">+ Add Campus Branch</Button>}
          />
        );

      case 'NoResultsState':
        return (
          <EmptyState
            icon="🔍"
            title="No Results Matching Query"
            description="No institutional records matched the given filter or search query."
            action={<Button variant="secondary">Clear Active Filters</Button>}
          />
        );

      case 'LoadingState':
      case 'Skeleton':
      case 'Spinner':
        return (
          <div className="space-y-2 w-full max-w-md mx-auto animate-pulse">
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4" />
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-full" />
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-5/6" />
          </div>
        );

      case 'ErrorState':
      case 'AccessDenied':
        return (
          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 text-center space-y-2 w-full max-w-sm">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto"><XCircle className="w-5 h-5" /></div>
            <div className="font-bold text-slate-900 text-sm">403 Access Denied</div>
            <p className="text-xs text-slate-500">You do not have administrative permissions to view this configuration node.</p>
          </div>
        );

      case 'NotFoundState':
        return (
          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 text-center space-y-2 w-full max-w-sm">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mx-auto"><HelpCircle className="w-5 h-5" /></div>
            <div className="font-bold text-slate-900 text-sm">404 Not Found</div>
            <p className="text-xs text-slate-500">The requested entity record was not found in the hierarchy.</p>
          </div>
        );

      // ═════════════════════════════════════════════════════════════════════
      // 19. HIERARCHY
      // ═════════════════════════════════════════════
      case 'TreeView':
      case 'TreeNode':
      case 'HierarchyPath':
      case 'WorkingContextTree':
        return (
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 text-left space-y-2 w-full">
            <div className="text-xs font-bold text-slate-700">Organizational Hierarchy Path:</div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 p-2.5 rounded-xl border border-indigo-200">
              <span>National Directorate (HO)</span>
              <ArrowRight className="w-3.5 h-3.5" />
              <span>Sindh South Region</span>
              <ArrowRight className="w-3.5 h-3.5" />
              <span>Beacon Horizon School</span>
            </div>
          </div>
        );

      case 'HierarchyMultiSelect':
        return (
          <div className="w-full max-w-lg mx-auto text-left space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Hierarchy MultiSelect (Interactive Tree)
              </span>
              <span className="text-[10px] font-mono text-indigo-600 font-bold">
                {hierarchyMultiValue.length} nodes selected
              </span>
            </div>
            <HierarchyMultiSelect
              label="Select Organizational Scope"
              placeholder="Choose institutional hierarchy nodes..."
              value={hierarchyMultiValue}
              onChange={setHierarchyMultiValue}
              disabled={activeState === 'disabled'}
              isLoading={activeState === 'loading'}
              isError={activeState === 'error'}
              errorMessage={activeState === 'error' ? 'Please select valid operational branches.' : undefined}
              nodes={[
                {
                  id: 'ho-001',
                  label: 'National Directorate (HO)',
                  type: 'head_office',
                  code: 'HO-001',
                  children: [
                    {
                      id: 'reg-01',
                      label: 'Sindh South Regional Office',
                      type: 'region',
                      code: 'REG-01',
                      children: [
                        {
                          id: 'sch-0042',
                          label: 'Beacon Horizon Public School',
                          type: 'school',
                          code: 'SCH-0042',
                          children: [
                            { id: 'br-0091', label: 'Clifton Campus Branch', type: 'branch', code: 'BR-0091' },
                            { id: 'br-0092', label: 'DHA Phase 6 Campus Branch', type: 'branch', code: 'BR-0092' },
                          ],
                        },
                        {
                          id: 'sch-0043',
                          label: 'City Grammar High School',
                          type: 'school',
                          code: 'SCH-0043',
                          children: [
                            { id: 'br-0093', label: 'Gulshan Iqbal Campus', type: 'branch', code: 'BR-0093' },
                          ],
                        },
                      ],
                    },
                    {
                      id: 'reg-02',
                      label: 'Federal Capital Regional Office',
                      type: 'region',
                      code: 'REG-02',
                      children: [
                        {
                          id: 'sch-0044',
                          label: 'Islamabad Model College',
                          type: 'school',
                          code: 'SCH-0044',
                          children: [
                            { id: 'br-0094', label: 'Sector F-8 Campus Branch', type: 'branch', code: 'BR-0094' },
                            { id: 'br-0095', label: 'Sector E-11 Campus Branch', type: 'branch', code: 'BR-0095' },
                          ],
                        },
                      ],
                    },
                  ],
                },
                {
                  id: 'ho-002',
                  label: 'Punjab Regional Board Directorate',
                  type: 'head_office',
                  code: 'HO-002',
                  children: [
                    {
                      id: 'sch-0045',
                      label: 'Lahore High Grammar School',
                      type: 'school',
                      code: 'SCH-0045',
                      children: [
                        { id: 'br-0096', label: 'Gulberg Campus Branch', type: 'branch', code: 'BR-0096' },
                      ],
                    },
                  ],
                },
              ]}
            />
          </div>
        );

      // ═════════════════════════════════════════════════════════════════════
      // 20-26. MISCELLANEOUS & ADVANCED STANDARDS
      // ═════════════════════════════════════════════
      case 'NotificationBadge':
        return (
          <div className="flex flex-col items-center gap-2">
            <div className="relative p-2 bg-white rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-sm">🔔</span>
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-rose-500 text-white font-black text-[9px] flex items-center justify-center">3</span>
            </div>
            <span className="text-xs text-slate-500">Unread Notification Counter</span>
          </div>
        );

      case 'AuditViewer':
      case 'AuditSummary':
        return (
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 text-xs text-slate-500 space-y-1 text-left w-full max-w-md">
            <div>Created by: <span className="font-semibold text-slate-700 dark:text-slate-300">admin@campus.edu</span> on 12 Jan 2026, 09:42 AM</div>
            <div>Last modified by: <span className="font-semibold text-slate-700 dark:text-slate-300">superadmin@campus.edu</span> on 24 Feb 2026, 04:15 PM (v4)</div>
          </div>
        );

      case 'ApprovalStatus':
      case 'ApprovalActions':
        return (
          <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-xs">
            <StatusBadge status="PENDING" />
            <div className="h-4 w-px bg-slate-200" />
            <Button variant="primary">Approve</Button>
            <Button variant="danger">Reject</Button>
          </div>
        );

      case 'TrendIndicator':
        return (
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span>↑ +12.4%</span>
            <span className="text-[10px] text-emerald-600 font-normal">vs last term</span>
          </div>
        );

      case 'ReportFilterBar':
      case 'ReportTable':
        return (
          <div className="w-full space-y-2 text-left">
            <AdminFilterBar categories={['All Quarters', 'Q1 2026', 'Q2 2026']} placeholder="Filter report data..." />
          </div>
        );

      case 'InfoHint':
        return (
          <div className="inline-flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-200">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>Enter the official school accreditation registration number.</span>
          </div>
        );

      case 'Divider':
        return (
          <div className="w-full max-w-sm space-y-3 text-center text-xs text-slate-400">
            <div>Top Block</div>
            <div className="border-t border-slate-200 dark:border-slate-800" />
            <div>Bottom Block</div>
          </div>
        );

      case 'ShortcutHint':
        return (
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 rounded bg-slate-100 border border-slate-200 text-xs font-mono font-bold text-slate-700">⌘K</kbd>
            <span className="text-xs text-slate-500">Quick Omnibox Search</span>
          </div>
        );

      case 'DynamicFormBuilder':
      case 'DraggableField':
        return (
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 text-left space-y-2 w-full max-w-md">
            <div className="text-xs font-bold text-slate-800">Dynamic Form Schema Runtime</div>
            <p className="text-xs text-slate-500">Renders versioned dynamic forms for admission processes and workflow schemas.</p>
          </div>
        );

      default:
        return (
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
            Standard preview for {item.displayName}
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm z-10">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">{item.displayName}</h2>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  item.status === 'LIVE'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200'
                    : item.status === 'PLANNED'
                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {item.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {item.canonicalName} • {item.category}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 flex-1">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Canonical Name</span>
              <div className="font-bold text-slate-800 dark:text-slate-200">{item.canonicalName}</div>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Category</span>
              <div className="font-bold text-slate-800 dark:text-slate-200 truncate">{item.category}</div>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Token Source</span>
              <div className="font-mono text-indigo-600 dark:text-indigo-400 text-[11px] truncate">{item.tokenSource}</div>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase">Implementation Source</span>
              <div className="font-mono text-slate-600 dark:text-slate-400 text-[11px] truncate">{item.sharedSource}</div>
            </div>

            {/* Searchable Aliases */}
            {item.aliases && item.aliases.length > 0 && (
              <div className="col-span-2 sm:col-span-4 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2 text-[11px]">
                <span className="text-slate-500 font-semibold">Search Aliases / Synonyms:</span>
                <div className="flex flex-wrap gap-1">
                  {item.aliases.map((al) => (
                    <span key={al} className="px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[10px] text-slate-700 dark:text-slate-300">
                      {al}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="col-span-2 sm:col-span-4 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] gap-1">
              <div>
                <span className="text-slate-500 font-semibold">Preview Subject: </span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  Isolated Standard Preview ({item.canonicalName})
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold">Preview Source: </span>
                <span className="font-mono text-slate-600 dark:text-slate-400 font-medium">
                  {previewSource}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive State & Variant Controls */}
          {item.variants.length > 1 && item.status === 'LIVE' && (
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-500">Variant:</span>
                <select
                  value={selectedVariant}
                  onChange={(e) => setSelectedVariant(e.target.value)}
                  className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold"
                >
                  {item.variants.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-500">Simulate:</span>
                {(['normal', 'disabled', 'loading'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setActiveState(st)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold capitalize transition-all cursor-pointer ${
                      activeState === st
                        ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Live Preview Canvas */}
          <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-6 flex items-center justify-center min-h-[220px] bg-slate-50/50 dark:bg-slate-950/40">
            {renderUniquePreview()}
          </div>

          {/* Override Support & Used In */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5">
              <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px]">Override Hierarchy Support</span>
              <div className="flex flex-wrap gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">Global Default: Yes</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">Module Variant: {item.overrideSupport.moduleVariant ? 'Yes' : 'No'}</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">Page Variant: {item.overrideSupport.pageVariant ? 'Yes' : 'No'}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5">
              <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px]">Used In (Consumers)</span>
              <div className="flex flex-wrap gap-1.5">
                {item.usedIn.map((u) => (
                  <span key={u} className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {u}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end sticky bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm">
          <Button variant="secondary" onClick={onClose}>
            Close Preview
          </Button>
        </div>
      </div>
    </div>
  );
}
