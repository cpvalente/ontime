import { create } from 'zustand';

type ActiveRundownScopeStore = {
  /** scopes on screen, in mount order */
  scopeIds: string[];
  /** the scope the user last worked in, if it is still on screen */
  activeScopeId: string | null;
  register: (scopeId: string) => void;
  unregister: (scopeId: string) => void;
  activate: (scopeId: string) => void;
};

export const useActiveRundownScopeStore = create<ActiveRundownScopeStore>((set) => ({
  scopeIds: [],
  activeScopeId: null,
  register: (scopeId) => set((state) => ({ scopeIds: [...state.scopeIds, scopeId] })),
  unregister: (scopeId) =>
    set((state) => ({
      scopeIds: state.scopeIds.filter((id) => id !== scopeId),
      activeScopeId: state.activeScopeId === scopeId ? null : state.activeScopeId,
    })),
  activate: (scopeId) => set({ activeScopeId: scopeId }),
}));

/** The scope which owns the keyboard: the one the user last worked in, otherwise the first on screen */
export function selectKeyboardScopeId(state: ActiveRundownScopeStore): string | null {
  return state.activeScopeId ?? state.scopeIds[0] ?? null;
}
