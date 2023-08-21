import { create } from 'zustand';

export enum AppMode {
  Run = 'run',
  Edit = 'edit',
}

export enum EditMode {
  Range = 'range',
  Singe = 'single',
  None = 'none',
}

const appModeKey = 'ontime-app-mode';

function getModeFromSession() {
  return localStorage.getItem(appModeKey) === AppMode.Run ? AppMode.Run : AppMode.Edit;
}

function persistModeToSession(mode: AppMode) {
  localStorage.setItem(appModeKey, mode);
}

type AppModeStore = {
  mode: AppMode;
  cursor: string | null;
  editMode: EditMode;
  idsToEdit: string[];
  setMode: (mode: AppMode) => void;
  setIdsToEdit: (id: string[]) => void;
  clearIdsToEdit: () => void;
};

export const useAppMode = create<AppModeStore>()((set) => ({
  mode: getModeFromSession(),
  cursor: null,
  editMode: EditMode.None,
  idsToEdit: [],
  setMode: (mode: AppMode) => {
    persistModeToSession(mode);

    return set(() => {
      return { mode };
    });
  },
  setIdsToEdit: (ids) => set(() => ({ idsToEdit: ids })),
  clearIdsToEdit: () => set(() => ({ idsToEdit: [] })),
}));
