import { MaybeString, ProjectStartup } from 'ontime-types';
import { create } from 'zustand';

interface DialogStore {
  showDialog: MaybeString;
  /** why the server loaded its project, only known when the server opened the dialog */
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
  setDialog: (name, projectStartup) => set({ showDialog: name, projectStartup: projectStartup ?? null }),
}));

/**
 * Allows setting a dialog to show (outside react)
 */
export function addDialog(name: string, projectStartup?: ProjectStartup): void {
  useDialogStore.getState().setDialog(name, projectStartup);
}
