import { create } from 'zustand';

// params that are auth/preset markers, not user view customisation (see common/utils/urlPresets.ts)
const RESERVED_PARAMS = new Set(['token', 'n', 'alias']);

interface SavedViewParamsStore {
  params: Record<string, string>; // view key (e.g. "timer") -> search string without leading "?"
  save: (view: string, search: string) => void;
  clearAll: () => void;
}

/**
 * Remembers the last view parameters used for each view so they can be
 * restored when the user navigates back to that view through the menu.
 * In-memory only: persists across SPA navigation, resets on a full page reload.
 */
export const useSavedViewParams = create<SavedViewParamsStore>((set) => ({
  params: {},
  save: (view, search) => set((state) => ({ params: { ...state.params, [view]: search } })),
  clearAll: () => set({ params: {} }),
}));

/**
 * Removes reserved (auth/preset) params from a search string, keeping only
 * genuine view customisation.
 */
export function stripReservedParams(search: string): string {
  const sp = new URLSearchParams(search);
  RESERVED_PARAMS.forEach((key) => sp.delete(key));
  return sp.toString();
}

/**
 * Whether the search params contain any genuine view customisation,
 * ignoring reserved params.
 */
export function hasCustomParams(searchParams: URLSearchParams): boolean {
  for (const key of searchParams.keys()) {
    if (!RESERVED_PARAMS.has(key)) return true;
  }
  return false;
}

export { RESERVED_PARAMS };
