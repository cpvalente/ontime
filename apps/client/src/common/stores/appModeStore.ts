import { create } from 'zustand';

export enum AppMode {
  Run = 'run',
  Edit = 'edit',
  Freeze = 'freeze',
}

const appModeKey = 'ontime-app-mode';

function getModeFromSession() {
  return sessionStorage.getItem(appModeKey) === AppMode.Run ? AppMode.Run : AppMode.Edit;
}

function persistModeToSession(mode: AppMode) {
  sessionStorage.setItem(appModeKey, mode);
}

type AppModeStore = {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  cursor: string | null;
  setCursor: (cursor: string | null) => void;
  eventClipBoard: string | null;
  setEventClipBoard: (eventId: string | null) => void;
};

export const useAppMode = create<AppModeStore>()((set) => ({
  mode: getModeFromSession(),
  cursor: null,
  eventClipBoard: null,
  setMode: (mode: AppMode) => {
    persistModeToSession(mode);

    return set(() => {
      return { mode };
    });
  },
  setCursor: (cursor: string | null) => set(() => ({ cursor })),
  setEventClipBoard: (eventClipBoard: string | null) => set(() => ({ eventClipBoard })),
}));
