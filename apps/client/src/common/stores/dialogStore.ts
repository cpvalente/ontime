import { MaybeString, ProjectStartup } from 'ontime-types';
import { create } from 'zustand';

interface DialogStore {
  showDialog: MaybeString;
  /** why the server loaded its project, only known when the server opened the welcome dialog */
  projectStartup: ProjectStartup | null;
  setDialog: (name: string, projectStartup?: ProjectStartup) => void;
  clearDialog: () => void;
}

/**
 * Used to allow the server to show a dialog in the client
 */
export const useDialogStore = create<DialogStore>((set) => ({
  showDialog: null,
  projectStartup: null,
  clearDialog: () => set({ showDialog: null, projectStartup: null }),
  // opening the dialog while it is open, eg: from the electron menu, keeps its startup reason
  // closing clears the reason, so a later reopen has none
  setDialog: (name, projectStartup) =>
    set((state) => ({ showDialog: name, projectStartup: projectStartup ?? state.projectStartup })),
}));

/**
 * Allows setting a dialog to show (outside react)
 */
export function addDialog(name: string, projectStartup?: ProjectStartup): void {
  useDialogStore.getState().setDialog(name, projectStartup);
}
