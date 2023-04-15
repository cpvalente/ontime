import { create } from 'zustand';

export enum AppMode {
  Run = 'run',
  Edit = 'edit',
}

type AppModeStore = {
  mode: AppMode;
  cursor: string | null;
  setCursor: (id: string | null) => void;
  setMode: (mode: AppMode) => void;
};

export const useAppMode = create<AppModeStore>()((set) => ({
  mode: AppMode.Edit,
  cursor: null,
  setCursor: (id: string | null) => set(() => ({ cursor: id })),
  setMode: (mode: AppMode) => set(() => ({ mode: mode })),
}));
