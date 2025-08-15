import { create } from 'zustand';

import { baseURI } from '../../externals';

export enum AppMode {
  Run = 'run',
  Edit = 'edit',
  Freeze = 'freeze',
}

const appModeKey = `${baseURI}ontime-app-mode`;

function getModeFromSession() {
  return sessionStorage.getItem(appModeKey) === AppMode.Run ? AppMode.Run : AppMode.Edit;
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
