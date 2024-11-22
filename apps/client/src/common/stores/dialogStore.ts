import { MaybeString } from 'ontime-types';
import { create } from 'zustand';

interface DialogStore {
  showDialog: MaybeString;
  setDialog: (name: string) => void;
  clearDialog: () => void;
}

/**
 * Used to allow the server to show a dialog in the client
 */
export const useDialogStore = create<DialogStore>((set) => ({
  showDialog: null,
  clearDialog: () => set({ showDialog: null }),
  setDialog: (name) => set({ showDialog: name }),
}));

/**
 * Allows setting a dialog to show (outside react)
 */
export function addDialog(name: string): void {
  useDialogStore.getState().setDialog(name);
}
