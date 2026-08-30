'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  AdminPageHeader,
  Button,
  AdminTable,
  AdminTableHead,
  AdminTableTh,
  AdminTableBody,
  AdminTableRow,
  AdminTableTd,
  AdminPagination,
  StatusBadge,
  ComponentPreviewModal,
  COMPONENT_REGISTRY,
  DESIGN_SYSTEM_CATEGORIES,
  CatalogItem,
} from '../../../../design-system';
import { usePermissions } from '../../../../lib/permissions';
import {
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Layers,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

export default function CampusOSDesignSystemPage() {
  const { canViewDesignSystem } = usePermissions();

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Live Preview Modal state
  const [previewItem, setPreviewItem] = useState<CatalogItem | null>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__openCanonicalPreview = (name: string) => {
        const target = COMPONENT_REGISTRY.find((i) => i.canonicalName === name || i.displayName === name);
        if (target) setPreviewItem(target);
      };
      (window as any).__closeCanonicalPreview = () => setPreviewItem(null);
    }
  }, []);
  // Smart Search Relevance Engine
  const filteredComponents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const scored = COMPONENT_REGISTRY.map((item) => {
      const matchesCat =
        selectedCategory === 'ALL' || item.category === selectedCategory;
      const matchesStatus =
        selectedStatus === 'ALL' || item.status === selectedStatus;

      if (!matchesCat || !matchesStatus) return { item, score: -1 };

      if (!query) return { item, score: 100 };

      // Synonym expansion map
      const synonyms: Record<string, string[]> = {
        button: ['button', 'buttons', 'add button', 'action button', 'btn'],
        buttons: ['button', 'buttons', 'add button', 'action button', 'btn'],
        popup: ['modal', 'popup', 'dialog', 'overlay', 'window'],
        popups: ['modal', 'popup', 'dialog', 'overlay', 'window'],
        modal: ['modal', 'popup', 'dialog', 'overlay', 'window'],
        modals: ['modal', 'popup', 'dialog', 'overlay', 'window'],
        dialog: ['modal', 'popup', 'dialog', 'overlay', 'window'],
        dialogs: ['modal', 'popup', 'dialog', 'overlay', 'window'],
        table: ['table', 'grid', 'datatable', 'rows', 'columns'],
        tables: ['table', 'grid', 'datatable', 'rows', 'columns'],
        grid: ['table', 'grid', 'datatable'],
        navigation: ['navigation', 'nav', 'menu', 'navbar', 'module tabs', 'tabs'],
        nav: ['navigation', 'nav', 'menu', 'navbar', 'tabs'],
        menu: ['navigation', 'nav', 'menu', 'dropdown', 'flyout'],
        header: ['header', 'top header', 'page header', 'app header', 'table header', 'sticky header'],
        headers: ['header', 'top header', 'page header', 'app header', 'table header', 'sticky header'],
        input: ['input', 'text input', 'field', 'form control', 'control', 'textbox'],
        inputs: ['input', 'text input', 'field', 'form control', 'control', 'textbox'],
        field: ['input', 'field', 'form field', 'form control'],
        fields: ['input', 'field', 'form field', 'form control'],
        control: ['input', 'control', 'form control', 'toggle', 'switch', 'checkbox'],
        controls: ['input', 'control', 'form control', 'toggle', 'switch', 'checkbox'],
        form: ['form', 'modal form', 'form modal', 'form grid', 'form section', 'form field'],
        forms: ['form', 'modal form', 'form modal', 'form grid', 'form section', 'form field'],
        status: ['status', 'badge', 'tag', 'state', 'active', 'inactive', 'pending'],
        badge: ['status', 'badge', 'tag', 'pill', 'active', 'inactive'],
        badges: ['status', 'badge', 'tag', 'pill', 'active', 'inactive'],
        tag: ['tag', 'badge', 'chip', 'filter chip'],
        tags: ['tag', 'badge', 'chip', 'filter chip'],
        action: ['action', 'actions', 'row actions', 'view action', 'edit action', 'delete action', 'button'],
        actions: ['action', 'actions', 'row actions', 'view action', 'edit action', 'delete action', 'button'],
        loading: ['loading', 'spinner', 'skeleton', 'loading button', 'loading state'],
        spinner: ['loading', 'spinner', 'skeleton', 'loading button'],
        dropdown: ['dropdown', 'select', 'cascading menu', 'navigation dropdown', 'select field'],
        stat: ['stat card', 'kpi card', 'metric card', 'stat', 'kpi', 'metric'],
        'stat card': ['stat card', 'kpi card', 'metric card', 'stat', 'kpi', 'metric'],
        kpi: ['stat card', 'kpi card', 'metric card', 'stat', 'kpi', 'metric'],
        'kpi card': ['stat card', 'kpi card', 'metric card', 'stat', 'kpi', 'metric'],
        metric: ['stat card', 'kpi card', 'metric card', 'stat', 'kpi', 'metric'],
        'metric card': ['stat card', 'kpi card', 'metric card', 'stat', 'kpi', 'metric'],
        multiselect: ['multiselect', 'multi select', 'multiple select', 'multiple selection', 'tag select', 'multi-select'],
        'multi select': ['multiselect', 'multi select', 'multiple select', 'multiple selection', 'tag select', 'multi-select'],
        'multiple select': ['multiselect', 'multi select', 'multiple select', 'multiple selection', 'tag select', 'multi-select'],
        'multiple selection': ['multiselect', 'multi select', 'multiple select', 'multiple selection', 'tag select', 'multi-select'],
        hierarchymultiselect: ['hierarchymultiselect', 'hierarchy multi select', 'hierarchy multi-select', 'tree multi select', 'scope multi select', 'campus multi select'],
        'hierarchy multi select': ['hierarchymultiselect', 'hierarchy multi select', 'hierarchy multi-select', 'tree multi select', 'scope multi select', 'campus multi select'],
        'tree multi select': ['hierarchymultiselect', 'hierarchy multi select', 'hierarchy multi-select', 'tree multi select', 'scope multi select', 'campus multi select'],
        'scope multi select': ['hierarchymultiselect', 'hierarchy multi select', 'hierarchy multi-select', 'tree multi select', 'scope multi select', 'campus multi select'],
        'campus multi select': ['hierarchymultiselect', 'hierarchy multi select', 'hierarchy multi-select', 'tree multi select', 'scope multi select', 'campus multi select'],
      };

      const querySynonyms = synonyms[query] || [query];

      const canonical = item.canonicalName.toLowerCase();
      const display = item.displayName.toLowerCase();
      const category = item.category.toLowerCase();
      const aliases = (item.aliases || []).map((a) => a.toLowerCase());
      const description = item.description.toLowerCase();

      let score = 0;

      // 1. Exact Canonical Match
      if (canonical === query) score += 1000;
      else if (querySynonyms.some((s) => canonical === s)) score += 950;

      // 2. Exact Display Name Match
      if (display === query) score += 900;
      else if (querySynonyms.some((s) => display === s)) score += 870;

      // 3. Exact Alias Match
      if (aliases.includes(query)) score += 850;
      else if (querySynonyms.some((s) => aliases.includes(s))) score += 800;

      // 4. Category Exact / Strong Match (e.g. searching "buttons" matches "10. Buttons")
      if (category.includes(query) || querySynonyms.some((s) => category.includes(s))) {
        score += 700;
      }

      // 5. Canonical Name Strong / Prefix / Word Match
      if (canonical.startsWith(query)) score += 500;
      else if (canonical.includes(query)) score += 450;
      else if (querySynonyms.some((s) => canonical.includes(s))) score += 400;

      // 6. Display Name Strong Match
      if (display.startsWith(query)) score += 400;
      else if (display.includes(query)) score += 350;
      else if (querySynonyms.some((s) => display.includes(s))) score += 300;

      // 7. Alias Partial Match
      if (aliases.some((a) => a.includes(query))) score += 250;
      else if (querySynonyms.some((s) => aliases.some((a) => a.includes(s)))) score += 200;

      // 8. Description-only Match (strictly ranked last)
      if (score === 0) {
        if (description.includes(query) || querySynonyms.some((s) => description.includes(s))) {
          score += 50;
        }
      }

      return { item, score };
    });

    return scored
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.item);
  }, [searchQuery, selectedCategory, selectedStatus]);

  // Pagination
  const totalPages = Math.ceil(filteredComponents.length / pageSize);
  const paginatedComponents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredComponents.slice(start, start + pageSize);
  }, [filteredComponents, currentPage, pageSize]);

  // Metrics
  const metrics = useMemo(() => {
    const total = COMPONENT_REGISTRY.length;
    const live = COMPONENT_REGISTRY.filter((i) => i.status === 'LIVE').length;
    const planned = COMPONENT_REGISTRY.filter((i) => i.status === 'PLANNED').length;
    const legacy = COMPONENT_REGISTRY.filter((i) => i.status === 'LEGACY').length;
    return { total, live, planned, legacy };
  }, []);

  // Fail-closed IAM Permission Protection
  if (!canViewDesignSystem) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="p-8 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto">
            <ShieldAlert className="w-7 h-7 stroke-2" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Access Restricted
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              You do not have the required <span className="font-mono font-bold text-slate-700 dark:text-slate-300">DESIGN_SYSTEM_VIEW</span> administrative capability to view the internal CampusOS Design System.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/admin-config"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 transition-colors"
            >
              Return to Administration Configuration
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* 1. Page Header (Dual headers above remain intact in app-shell layout) */}
      <AdminPageHeader
        section="Administration Configuration"
        sectionHref="/admin-config"
        group="General / Shared Masters"
        groupHref="/admin-config?cat=general_shared_masters"
        title="CampusOS Design System"
        description="Centralized UI/UX architecture, design tokens, shared component registry, and live visual previews. One change centrally updates every consuming ERP page."
      />

      {/* 2. Key Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Total Catalog Items
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              {metrics.total}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">26 Enterprise Categories</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Live Centralized
            </div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {metrics.live}
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
              Ready & Token Controlled
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Planned Roadmap
            </div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">
              {metrics.planned}
            </div>
            <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-medium">
              Catalog Standardized
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Legacy / Pending Migration
            </div>
            <div className="text-2xl font-bold text-slate-700 dark:text-slate-300 mt-0.5">
              {metrics.legacy}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-medium">
              Safe Phased Migration
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-500">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="flex-1 w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search component by name, canonical code, tokens, or category (e.g. Button, Table, Modal, Tabs)..."
            className="w-full bg-transparent focus:outline-none text-slate-900 dark:text-white placeholder-slate-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-semibold focus:outline-none cursor-pointer max-w-[200px] truncate"
            >
              <option value="ALL">All Categories (26)</option>
              {DESIGN_SYSTEM_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="LIVE">🟢 LIVE</option>
              <option value="PLANNED">🟡 PLANNED</option>
              <option value="LEGACY">⚪ LEGACY</option>
              <option value="DEPRECATED">🔴 DEPRECATED</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Component Catalog Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <div>
            Showing <span className="font-bold text-slate-800 dark:text-slate-200">{filteredComponents.length}</span> matching components
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[11px] text-slate-400">Click &quot;View Live Preview&quot; to inspect actual tokens and interactive variants</span>
          </div>
        </div>

        <AdminTable density="normal">
          <AdminTableHead>
            <AdminTableTh>Display Name & Description</AdminTableTh>
            <AdminTableTh>Canonical Name</AdminTableTh>
            <AdminTableTh>Category</AdminTableTh>
            <AdminTableTh>Status</AdminTableTh>
            <AdminTableTh>Used In (Active Tracking)</AdminTableTh>
            <AdminTableTh className="text-right">Actions</AdminTableTh>
          </AdminTableHead>
          <AdminTableBody>
            {paginatedComponents.length === 0 ? (
              <AdminTableRow>
                <AdminTableTd colSpan={6} className="text-center py-12 text-slate-400">
                  No components match the specified filter criteria.
                </AdminTableTd>
              </AdminTableRow>
            ) : (
              paginatedComponents.map((item) => {
                const isLive = item.status === 'LIVE';

                return (
                  <AdminTableRow key={item.id}>
                    <AdminTableTd>
                      <div className="space-y-0.5">
                        <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{item.displayName}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 line-clamp-1">
                          {item.description}
                        </div>
                      </div>
                    </AdminTableTd>

                    <AdminTableTd>
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400">
                        {item.canonicalName}
                      </span>
                    </AdminTableTd>

                    <AdminTableTd>
                      <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                        {item.category}
                      </span>
                    </AdminTableTd>

                    <AdminTableTd>
                      <StatusBadge status={item.status} size="sm" />
                    </AdminTableTd>

                    <AdminTableTd>
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {item.usedIn.slice(0, 2).map((u, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 truncate"
                          >
                            {u}
                          </span>
                        ))}
                        {item.usedIn.length > 2 && (
                          <span className="text-[10px] text-slate-400 font-semibold self-center">
                            +{item.usedIn.length - 2} more
                          </span>
                        )}
                      </div>
                    </AdminTableTd>

                    <AdminTableTd className="text-right">
                      <Button
                        size="sm"
                        variant={isLive ? 'primary' : 'outline'}
                        onClick={() => setPreviewItem(item)}
                        leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                      >
                        View Live Preview
                      </Button>
                    </AdminTableTd>
                  </AdminTableRow>
                );
              })
            )}
          </AdminTableBody>
        </AdminTable>

        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalRecords={filteredComponents.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* 5. Live Component Preview Modal */}
      <ComponentPreviewModal
        item={previewItem}
        isOpen={!!previewItem}
        onClose={() => setPreviewItem(null)}
      />
    </div>
  );
}
