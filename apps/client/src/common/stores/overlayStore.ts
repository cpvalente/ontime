import { useEffect } from 'react';
import { create } from 'zustand';

interface OverlayStore {
  openCount: number;
  register: () => void;
  unregister: () => void;
}

const useOverlayStore = create<OverlayStore>((set) => ({
  openCount: 0,
  register: () => set((state) => ({ openCount: state.openCount + 1 })),
  unregister: () => set((state) => ({ openCount: Math.max(0, state.openCount - 1) })),
}));

/**
 * Keeps track of how many modals and dialogs are open.
 *
 * Base UI dismisses its own popups on Escape, but our global Escape handlers
 * listen on the document and would fire alongside it. Rather than depend on
 * listener registration order, the handlers stand down while an overlay is open.
 */
export function useRegisterOverlay(isOpen: boolean): void {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const { register, unregister } = useOverlayStore.getState();
    register();
    return unregister;
  }, [isOpen]);
}

/** Whether a modal or dialog currently owns the Escape key */
export function useHasOpenOverlay(): boolean {
  return useOverlayStore((state) => state.openCount > 0);
}
