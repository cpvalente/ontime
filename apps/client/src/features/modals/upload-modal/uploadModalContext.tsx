import { create } from 'zustand';

type UploadModalContext = {
  file: File | null;
  setFile: (file: File | null) => void;

  progress: number;
  setProgress: (progress: number) => void;

  clear: () => void;
};

export const useUploadModalContextStore = create<UploadModalContext>((set) => ({
  file: null,
  setFile: (file: File | null) => set({ file }),

  progress: 0,
  setProgress: (progress: number) => set({ progress }),

  clear: () => set({ file: null, progress: 0 }),
}));
