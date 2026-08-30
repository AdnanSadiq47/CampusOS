'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Star,
  Clock,
  LayoutGrid,
  List,
} from 'lucide-react';
import {
  CONFIG_CATEGORIES,
  CONFIG_REGISTRY,
  ConfigCategoryMeta,
  ConfigItem,
} from '../../../lib/admin-config-registry';
import { useAdminPreferences, RECENTS_STORAGE_KEY } from '../../../lib/use-admin-preferences';

export default function AdminConfigHomePage() {
  // Search & Navigation State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeCategoryDetail, setActiveCategoryDetail] = useState<ConfigCategoryMeta | null>(null);
  const [isCustomizeQuickActionsOpen, setIsCustomizeQuickActionsOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Shared User Preferences
  const {
    favorites,
    quickActions,
    authorizedFavorites,
    authorizedQuickActions,
    authorizedRecents,
    toggleFavorite,
    toggleQuickAction,
    reorderQuickActions,
    recordRecent,
    hasPermissionForItem,
  } = useAdminPreferences();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleItemClick = (item: ConfigItem) => {
    if (!item.isImplemented) return;
    recordRecent(item.id);
  };

  const handleToggleFavWithToast = (itemId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isNowFav = toggleFavorite(itemId);
    const item = CONFIG_REGISTRY.find((i) => i.id === itemId);
    showToast(isNowFav ? `★ Added ${item?.name || 'item'} to Favorites` : `Removed ${item?.name || 'item'} from Favorites`);
  };

  // Move Quick Action Up
  const handleMoveQuickActionUp = (index: number) => {
    if (index <= 0) return;
    const updated = [...quickActions];
    const temp = updated[index - 1]!;
    updated[index - 1] = updated[index]!;
    updated[index] = temp;
    reorderQuickActions(updated);
  };

  // Move Quick Action Down
  const handleMoveQuickActionDown = (index: number) => {
    if (index >= quickActions.length - 1) return;
    const updated = [...quickActions];
    const temp = updated[index + 1]!;
    updated[index + 1] = updated[index]!;
    updated[index] = temp;
    reorderQuickActions(updated);
  };

  // Filtered Items based on Search and Category
  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return CONFIG_REGISTRY.filter((item) => {
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }
      if (!query) return true;
      return (
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.keywords.some((k) => k.toLowerCase().includes(query))
      );
    });
  }, [searchQuery, selectedCategory]);

  // Categories with their filtered items
  const categoriesWithItems = useMemo(() => {
    return CONFIG_CATEGORIES.map((cat) => {
      const items = filteredItems.filter((item) => item.category === cat.key);
      const implementedCount = items.filter((i) => i.isImplemented).length;
      return {
        ...cat,
        items,
        totalCount: items.length,
        implementedCount,
      };
    }).filter((cat) => cat.items.length > 0);
  }, [filteredItems]);

  // Global KPIs
  const totalSettingsCount = CONFIG_REGISTRY.length;
  const implementedCount = CONFIG_REGISTRY.filter((i) => i.isImplemented).length;

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 p-6 space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <span>✨</span> {toastMessage}
        </div>
      )}

      {/* ── 1. Page Header ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 tracking-wide uppercase">
            <span>Administration Configuration</span>
            <span>/</span>
            <span className="text-slate-400 dark:text-slate-500 font-medium">Control Center</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Administration Configuration
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-2xl">
            Manage organization structure, master data, access settings and system configuration from one central workspace.
          </p>
        </div>

        {/* Global Summary Badges */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Categories</span>
            <p className="text-base font-bold text-slate-800 dark:text-slate-200">{CONFIG_CATEGORIES.length}</p>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Settings</span>
            <p className="text-base font-bold text-indigo-700 dark:text-indigo-300">{totalSettingsCount}</p>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Operational</span>
            <p className="text-base font-bold text-emerald-700 dark:text-emerald-300">{implementedCount}</p>
          </div>
        </div>
      </div>

      {/* ── 2. Quick Shortcuts Bar ─────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm">⚡</span>
            <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Quick Shortcuts ({authorizedQuickActions.length})
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setIsCustomizeQuickActionsOpen(true)}
            className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            ⚙️ Customize Shortcuts
          </button>
        </div>

        {authorizedQuickActions.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            {authorizedQuickActions.map((item) => (
              <Link
                key={item.id}
                href={item.route}
                onClick={() => handleItemClick(item)}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800 text-xs font-semibold transition-all shadow-sm group"
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
                <span className="text-[10px] text-slate-400 group-hover:text-indigo-500">→</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-400 py-1">
            No quick shortcuts configured. Click 'Customize Shortcuts' to pin your frequently accessed pages.
          </div>
        )}
      </div>

      {/* ── 3. Global Search & Filter Controls ─────────────────────── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search configuration settings, e.g. Schools, Branches, Countries, Areas, Postal Codes, Security..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Dropdown Filter & View Toggle */}
        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm cursor-pointer"
          >
            <option value="ALL">All Categories ({CONFIG_CATEGORIES.length})</option>
            {CONFIG_CATEGORIES.map((cat) => (
              <option key={cat.key} value={cat.key}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>

          {/* Grid / List Mode Toggle */}
          <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 p-1.5 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 p-1.5 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title="List Directory View"
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 4. Favorites & Recents Section ─────────────────────────── */}
      {!searchQuery && selectedCategory === 'ALL' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Favorites */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                <span>Starred Favorites ({authorizedFavorites.length})</span>
              </span>
            </div>
            {authorizedFavorites.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {authorizedFavorites.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:border-indigo-200 transition-colors"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      {item.isImplemented ? (
                        <Link
                          href={item.route}
                          onClick={() => handleItemClick(item)}
                          className="text-xs font-semibold text-slate-800 dark:text-slate-200 hover:text-indigo-600 truncate"
                        >
                          {item.name}
                        </Link>
                      ) : (
                        <span className="text-xs font-medium text-slate-500 truncate">{item.name}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleToggleFavWithToast(item.id, e)}
                      className="text-amber-500 hover:opacity-75 cursor-pointer ml-1"
                      title="Remove from favorites"
                    >
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center">
                <p className="text-xs text-slate-400">
                  You have no starred favorites yet. Click the Favorite button on any page header to pin it here.
                </p>
              </div>
            )}
          </div>

          {/* Recently Used */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                <span>Recently Visited ({authorizedRecents.length})</span>
              </span>
              {authorizedRecents.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    try {
                      localStorage.removeItem(RECENTS_STORAGE_KEY);
                    } catch {}
                    window.location.reload();
                  }}
                  className="text-[10px] text-slate-400 hover:text-rose-500 cursor-pointer"
                >
                  Clear History
                </button>
              )}
            </div>
            {authorizedRecents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {authorizedRecents.map((item) => (
                  <Link
                    key={item.id}
                    href={item.route}
                    onClick={() => handleItemClick(item)}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:border-indigo-200 transition-colors"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span>{item.icon}</span>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">Open →</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center">
                <p className="text-xs text-slate-400">
                  No recently visited configuration pages yet. Pages you visit will appear here automatically.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 5. Main Content: Grid Mode vs. List Mode ────────────────── */}
      {viewMode === 'grid' ? (
        /* ── Grid View ── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {categoriesWithItems.map((cat) => (
            <div
              key={cat.key}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
            >
              {/* Category Card Header */}
              <div className="p-5 space-y-2.5">
                <div className="flex items-start justify-between">
                  <span className="text-2xl p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                    {cat.icon}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {cat.implementedCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        {cat.implementedCount} Active
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      {cat.totalCount} items
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{cat.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                    {cat.description}
                  </p>
                </div>

                {/* Top Items Preview */}
                <div className="pt-2 space-y-1.5">
                  {cat.items.slice(0, 4).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-xs py-1 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group"
                    >
                      <div className="flex items-center gap-2 overflow-hidden pr-2">
                        <button
                          type="button"
                          onClick={(e) => handleToggleFavWithToast(item.id, e)}
                          className={`text-xs cursor-pointer ${
                            favorites.includes(item.id) ? 'text-amber-500' : 'text-slate-300 dark:text-slate-600 hover:text-amber-400'
                          }`}
                          title="Toggle favorite"
                        >
                          ★
                        </button>
                        <span>{item.icon}</span>
                        {item.isImplemented ? (
                          <Link
                            href={item.route}
                            onClick={() => handleItemClick(item)}
                            className="text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium truncate"
                          >
                            {item.name}
                          </Link>
                        ) : (
                          <span className="text-slate-400 truncate">{item.name}</span>
                        )}
                      </div>

                      {item.isImplemented ? (
                        <Link
                          href={item.route}
                          onClick={() => handleItemClick(item)}
                          className="opacity-0 group-hover:opacity-100 text-indigo-600 dark:text-indigo-400 font-semibold text-[10px] transition-opacity"
                        >
                          Open →
                        </Link>
                      ) : (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400">
                          Soon
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveCategoryDetail(cat)}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  View All {cat.totalCount} Settings →
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ── List / Directory View ── */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-950/75 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4 w-10">★</th>
                  <th className="py-3 px-4">Setting / Master</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Scope</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredItems.map((item) => {
                  const cat = CONFIG_CATEGORIES.find((c) => c.key === item.category);
                  const isFav = favorites.includes(item.id);
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={(e) => handleToggleFavWithToast(item.id, e)}
                          className={`text-sm cursor-pointer ${isFav ? 'text-amber-500' : 'text-slate-300 dark:text-slate-600 hover:text-amber-400'}`}
                          title="Toggle favorite"
                        >
                          ★
                        </button>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <span>{item.icon}</span>
                          <span>{item.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                        {cat?.name || item.category}
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                        {item.description}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {item.scopeClassification}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.isImplemented ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            Coming Soon
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {item.isImplemented ? (
                          <Link
                            href={item.route}
                            onClick={() => handleItemClick(item)}
                            className="inline-flex items-center px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 font-semibold text-xs transition-colors"
                          >
                            Open →
                          </Link>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 6. Category Detail Modal / Drawer ───────────────────────── */}
      {activeCategoryDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative z-10 w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="flex items-start justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
              <div className="flex items-center gap-3">
                <span className="text-3xl p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                  {activeCategoryDetail.icon}
                </span>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {activeCategoryDetail.name}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {activeCategoryDetail.description}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveCategoryDetail(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Item List */}
            <div className="p-5 space-y-3 overflow-y-auto max-h-[60vh]">
              {CONFIG_REGISTRY.filter((i) => i.category === activeCategoryDetail.key).map((item) => {
                const isFav = favorites.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/30 hover:border-indigo-100 dark:hover:border-indigo-900 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={(e) => handleToggleFavWithToast(item.id, e)}
                        className={`text-base cursor-pointer mt-0.5 ${
                          isFav ? 'text-amber-500' : 'text-slate-300 dark:text-slate-600 hover:text-amber-400'
                        }`}
                        title="Toggle favorite"
                      >
                        ★
                      </button>
                      <span className="text-xl">{item.icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">{item.name}</h4>
                          <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                            {item.scopeClassification}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 flex-shrink-0">
                      {item.isImplemented ? (
                        <Link
                          href={item.route}
                          onClick={() => {
                            handleItemClick(item);
                            setActiveCategoryDetail(null);
                          }}
                          className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors"
                        >
                          Open Setting →
                        </Link>
                      ) : (
                        <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-medium">
                          Coming Soon
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveCategoryDetail(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 7. Customize Quick Actions Modal (Reorder, Add, Remove) ─── */}
      {isCustomizeQuickActionsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative z-10 w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Customize Quick Shortcuts</h3>
                <p className="text-xs text-slate-500">Add, remove, and reorder shortcuts pinned to your top navigation bar.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomizeQuickActionsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-5 overflow-y-auto max-h-[60vh] text-xs">
              {/* Section 1: Active Shortcuts with Reordering */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>📌 Active Pinned Shortcuts ({authorizedQuickActions.length})</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Use the ↑ / ↓ buttons to rearrange order on your shortcuts bar.
                </p>

                <div className="space-y-1.5 pt-1">
                  {authorizedQuickActions.map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-[10px] font-bold text-slate-400 w-4">{idx + 1}.</span>
                        <span className="text-base">{item.icon}</span>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{item.name}</p>
                          <p className="text-[10px] text-slate-400">{item.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveQuickActionUp(idx)}
                          className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed font-bold"
                          title="Move up"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          disabled={idx === authorizedQuickActions.length - 1}
                          onClick={() => handleMoveQuickActionDown(idx)}
                          className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed font-bold"
                          title="Move down"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleQuickAction(item.id)}
                          className="px-2 py-1 rounded-lg border border-rose-200 dark:border-rose-900/60 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs ml-1"
                          title="Remove shortcut"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 2: Available Settings to Add */}
              <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <h4 className="font-bold text-slate-900 dark:text-white">
                  ➕ Available Pages to Pin
                </h4>
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {CONFIG_REGISTRY.filter((i) => i.isImplemented && !quickActions.includes(i.id) && hasPermissionForItem(i)).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span>{item.icon}</span>
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{item.name}</p>
                          <p className="text-[10px] text-slate-400">{item.description}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleQuickAction(item.id)}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 text-xs font-semibold cursor-pointer border border-indigo-200 dark:border-indigo-800"
                      >
                        + Pin
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-end">
              <button
                type="button"
                onClick={() => setIsCustomizeQuickActionsOpen(false)}
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
