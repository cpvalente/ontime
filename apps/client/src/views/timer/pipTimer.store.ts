import { Root } from 'react-dom/client';
import { create } from 'zustand';

type MaybeRoot = Root | null;

interface PipStore {
  root: MaybeRoot;
  setRoot: (root: MaybeRoot) => void;
}

export const usePipStore = create<PipStore>((set) => ({
  root: null,
  setRoot: (root: MaybeRoot) => set({ root }),
}));
