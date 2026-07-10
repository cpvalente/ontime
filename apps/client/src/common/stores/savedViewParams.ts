import { create } from 'zustand';

// params that are auth/preset markers, not user view customisation (see common/utils/urlPresets.ts)
export const reservedParams = new Set(['token', 'n', 'alias']);

interface SavedViewParamsStore {
  params: Record<string, string>; // view key (e.g. "timer") -> search string without leading "?"
  save: (view: string, search: string) => void;
  clear: (view: string) => void;
  clearAll: () => void;
}

/**
 * Remembers the last view parameters used for each view so they can be
 * restored when the user navigates back to that view through the menu.
 * In-memory only: persists across SPA navigation, resets on a full page reload.
 */
export const useSavedViewParams = create<SavedViewParamsStore>((set) => ({
  params: {},
  save: (view, search) =>
    set((state) => {
      // ignore empty view keys and do not store empty entries, so the
      // "saved changes" indicator only reflects genuine customisation
      if (!view) return state;
      const params = { ...state.params };
      if (search) {
        params[view] = search;
      } else {
        delete params[view];
      }
      return { params };
    }),
  clear: (view) =>
    set((state) => {
      if (!state.params[view]) return state;
      const params = { ...state.params };
      delete params[view];
      return { params };
    }),
  clearAll: () => set({ params: {} }),
}));

/**
 * Removes reserved (auth/preset) params from a search string, keeping only
 * genuine view customisation.
 */
export function stripReservedParams(search: string): string {
  const sp = new URLSearchParams(search);
  reservedParams.forEach((key) => sp.delete(key));
  return sp.toString();
}

/**
 * Whether the search params contain any genuine view customisation,
 * ignoring reserved params.
 */
export function hasCustomParams(searchParams: URLSearchParams): boolean {
  for (const key of searchParams.keys()) {
    if (!reservedParams.has(key)) return true;
  }
  return false;
}
