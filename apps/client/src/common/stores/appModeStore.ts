import { create } from 'zustand';

export enum AppMode {
  Run = 'run',
  Edit = 'edit',
}

const appModeKey = 'ontime-app-mode';

function getModeFromSession() {
  return localStorage.getItem(appModeKey) === AppMode.Run ? AppMode.Run : AppMode.Edit;
}

async function persistModeToSession(mode: AppMode) {
  localStorage.setItem(appModeKey, mode);
}

type AppModeStore = {
  mode: AppMode;
  cursor: string | null;
  editId: string | null;
  setMode: (mode: AppMode) => void;
  setCursor: (id: string | null, isEditable?: boolean) => void;
  setEditId: (id: string | null) => void;
};

export const useAppMode = create<AppModeStore>()((set) => ({
  mode: getModeFromSession(),
  cursor: null,
  editId: null,
  setMode: (mode: AppMode) =>
    set((state) => {
      persistModeToSession(mode);
      return mode === AppMode.Edit
        ? {
            editId: state.cursor,
            mode: mode,
          }
        : {
            editId: null,
            mode: mode,
          };
    }),
  setCursor: (id: string | null, isEditable?: boolean) =>
    set((state) => {
      if (isEditable) {
        return state.mode === AppMode.Edit
          ? {
              cursor: id,
              editId: id,
            }
          : {
              cursor: id,
            };
      } else {
        return { cursor: id, editId: null };
      }
    }),
  setEditId: (id: string | null) =>
    set((state) => {
      return state.mode === AppMode.Edit
        ? {
            cursor: id,
            editId: id,
          }
        : {
            editId: id,
          };
    }),
}));
