'use client';

import { useState, useEffect, useCallback } from 'react';
import { CONFIG_REGISTRY, ConfigItem } from './admin-config-registry';

export const FAVORITES_STORAGE_KEY = 'campusos_admin_config_favorites';
export const RECENTS_STORAGE_KEY = 'campusos_admin_config_recents';
export const QUICK_ACTIONS_STORAGE_KEY = 'campusos_admin_config_quick_actions';

// Broadcast custom event for synchronized cross-component state updates
const PREFERENCE_CHANGE_EVENT = 'campusos_admin_preferences_changed';

function emitPreferenceChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(PREFERENCE_CHANGE_EVENT));
  }
}

/**
 * Shared hook for user personalization: Favorites, Quick Actions, and Recently Used tracking.
 */
export function useAdminPreferences(currentUserPermissions: string[] = ['*']) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recents, setRecents] = useState<string[]>([]);
  const [quickActions, setQuickActions] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  const loadPreferences = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const savedFavs = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (savedFavs) {
        const parsed = JSON.parse(savedFavs);
        if (Array.isArray(parsed)) setFavorites(parsed);
      }

      const savedRecents = localStorage.getItem(RECENTS_STORAGE_KEY);
      if (savedRecents) {
        const parsed = JSON.parse(savedRecents);
        if (Array.isArray(parsed)) setRecents(parsed);
      }

      const savedQuick = localStorage.getItem(QUICK_ACTIONS_STORAGE_KEY);
      if (savedQuick) {
        const parsed = JSON.parse(savedQuick);
        if (Array.isArray(parsed)) setQuickActions(parsed);
      } else {
        // Default initial quick actions if first time
        setQuickActions([
          'org_schools',
          'org_branches',
          'loc_countries',
          'loc_areas',
          'org_head_offices',
        ]);
      }
    } catch {
      // Ignore storage parse issues
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadPreferences();

    const handleStorageChange = () => {
      loadPreferences();
    };

    window.addEventListener(PREFERENCE_CHANGE_EVENT, handleStorageChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener(PREFERENCE_CHANGE_EVENT, handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadPreferences]);

  // Check if user is authorized for an item
  const hasPermissionForItem = useCallback(
    (item: ConfigItem) => {
      if (!currentUserPermissions || currentUserPermissions.includes('*')) return true;
      return currentUserPermissions.includes(item.requiredPermission);
    },
    [currentUserPermissions]
  );

  // Toggle Favorite
  const toggleFavorite = useCallback((itemId: string): boolean => {
    let isNowFavorited = false;
    setFavorites((prev) => {
      let updated: string[];
      if (prev.includes(itemId)) {
        updated = prev.filter((id) => id !== itemId);
        isNowFavorited = false;
      } else {
        updated = [...prev, itemId];
        isNowFavorited = true;
      }
      try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    emitPreferenceChange();
    return isNowFavorited;
  }, []);

  // Toggle Quick Action
  const toggleQuickAction = useCallback((itemId: string): boolean => {
    let isNowQuickAction = false;
    setQuickActions((prev) => {
      let updated: string[];
      if (prev.includes(itemId)) {
        updated = prev.filter((id) => id !== itemId);
        isNowQuickAction = false;
      } else {
        updated = [...prev, itemId];
        isNowQuickAction = true;
      }
      try {
        localStorage.setItem(QUICK_ACTIONS_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    emitPreferenceChange();
    return isNowQuickAction;
  }, []);

  // Reorder Quick Actions
  const reorderQuickActions = useCallback((newOrder: string[]) => {
    setQuickActions(newOrder);
    try {
      localStorage.setItem(QUICK_ACTIONS_STORAGE_KEY, JSON.stringify(newOrder));
    } catch {}
    emitPreferenceChange();
  }, []);

  // Record Recent Navigation
  const recordRecent = useCallback((itemId: string) => {
    setRecents((prev) => {
      const filtered = prev.filter((id) => id !== itemId);
      const updated = [itemId, ...filtered].slice(0, 8);
      try {
        localStorage.setItem(RECENTS_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    emitPreferenceChange();
  }, []);

  // Resolved Config Items with Permission Safety
  const authorizedFavorites = favorites
    .map((id) => CONFIG_REGISTRY.find((item) => item.id === id))
    .filter((item): item is ConfigItem => Boolean(item && hasPermissionForItem(item)));

  const authorizedQuickActions = quickActions
    .map((id) => CONFIG_REGISTRY.find((item) => item.id === id))
    .filter((item): item is ConfigItem => Boolean(item && hasPermissionForItem(item)));

  const authorizedRecents = recents
    .map((id) => CONFIG_REGISTRY.find((item) => item.id === id))
    .filter((item): item is ConfigItem => Boolean(item && hasPermissionForItem(item)));

  return {
    isLoaded,
    favorites,
    quickActions,
    recents,
    authorizedFavorites,
    authorizedQuickActions,
    authorizedRecents,
    toggleFavorite,
    toggleQuickAction,
    reorderQuickActions,
    recordRecent,
    hasPermissionForItem,
  };
}

/**
 * Utility to find a ConfigItem by its route pathname or ID
 */
export function findConfigItemByRoute(pathname: string): ConfigItem | undefined {
  const normalized = pathname.replace(/\/$/, '');
  return CONFIG_REGISTRY.find((item) => item.route === normalized);
}

export function findConfigItemById(id: string): ConfigItem | undefined {
  return CONFIG_REGISTRY.find((item) => item.id === id);
}
