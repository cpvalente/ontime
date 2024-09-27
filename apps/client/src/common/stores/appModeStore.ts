import { create } from 'zustand';

export enum AppMode {
  Run = 'run',
  Edit = 'edit',
  Freeze = 'freeze',
}

const appModeKey = 'ontime-app-mode';

function getModeFromSession() {
  const appModeFromSessionStorage = sessionStorage.getItem(appModeKey);

  switch (appModeFromSessionStorage) {
    case AppMode.Run:
      return AppMode.Run;
    case AppMode.Edit:
      return AppMode.Edit;
    case AppMode.Freeze:
      return AppMode.Freeze;
    default:
      return AppMode.Run;
  }
}

function persistModeToSession(mode: AppMode) {
  sessionStorage.setItem(appModeKey, mode);
}

type AppModeStore = {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
};

export const useAppMode = create<AppModeStore>()((set) => ({
  mode: getModeFromSession(),
  setMode: (mode: AppMode) => {
    persistModeToSession(mode);

    return set(() => {
      return { mode };
    });
  },
}));
