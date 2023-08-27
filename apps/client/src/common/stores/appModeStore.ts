import { create } from 'zustand';

export enum AppMode {
  Run = 'run',
  Edit = 'edit',
}

export enum EditMode {
  Range = 'range',
  Single = 'single',
  CherryPick = 'cherryPick',
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
  idsToEdit: { id: string; index: number; anchor: boolean }[];
  isEventSelected: (id: string, index: number) => boolean;
  setMode: (mode: AppMode) => void;
  setEditMode: (mode: EditMode) => void;
  setIdsToEdit: (id: string, index: number) => void;
  clearIdsToEdit: () => void;
};

export const useAppMode = create<AppModeStore>()((set, get) => ({
  mode: getModeFromSession(),
  cursor: null,
  editMode: EditMode.Single,
  idsToEdit: [],
  setMode: (mode: AppMode) => {
    persistModeToSession(mode);

    return set(() => {
      return { mode };
    });
  },
  isEventSelected: (id, index) => {
    const { idsToEdit } = get();

    return idsToEdit.some((event) => {
      const doesEventsHaveAnchor = idsToEdit.some((event) => event.anchor);

      if (doesEventsHaveAnchor) {
        const firstSelectedEvent = idsToEdit.at(0);
        const lastSelectedEvent = idsToEdit.at(-1);

        if (!firstSelectedEvent || !lastSelectedEvent) {
          return event.id === id;
        }

        if (firstSelectedEvent.index <= index && lastSelectedEvent.index >= index) {
          return true;
        }
      }

      return event.id === id;
    });
  },
  setEditMode: (mode) => set(() => ({ editMode: mode })),
  setIdsToEdit: (id, index) =>
    set(({ editMode, idsToEdit }) => {
      if (editMode === EditMode.Single) {
        return { idsToEdit: [{ id, index, anchor: false }] };
      }

      if (editMode === EditMode.CherryPick) {
        const uniqueEventsWithoutAnchor = idsToEdit
          .map(({ id, index }) => ({ id, index, anchor: false }))
          // in case the user toggles the same event,
          // we can preemptively filter out duplicates
          .filter((event) => event.id !== id);

        if (uniqueEventsWithoutAnchor.length !== idsToEdit.length) {
          return { idsToEdit: uniqueEventsWithoutAnchor };
        }

        return { idsToEdit: [...uniqueEventsWithoutAnchor, { id, index, anchor: false }] };
      }

      if (editMode === EditMode.Range) {
        const eventWithAnchor = idsToEdit.find((id) => id.anchor);

        if (!eventWithAnchor) {
          if (idsToEdit.length) {
            const firstEvent = idsToEdit.at(0);

            if (!firstEvent) {
              return { idsToEdit: [{ id, index, anchor: true }] };
            }

            if (firstEvent.id === id) {
              return { idsToEdit: [{ ...firstEvent, anchor: true }] };
            }

            if (firstEvent.index > index) {
              return {
                idsToEdit: [
                  { id, index, anchor: false },
                  { ...firstEvent, anchor: true },
                ],
              };
            }

            return {
              idsToEdit: [
                { ...firstEvent, anchor: true },
                { id, index, anchor: false },
              ],
            };
          }

          return { idsToEdit: [{ id, index, anchor: true }] };
        }

        if (eventWithAnchor.id === id) {
          return { idsToEdit: [{ ...eventWithAnchor, anchor: true }] };
        }

        if (eventWithAnchor.index > index) {
          return {
            idsToEdit: [{ id, index, anchor: false }, eventWithAnchor],
          };
        }

        return {
          idsToEdit: [eventWithAnchor, { id, index, anchor: false }],
        };
      }

      return { idsToEdit: [] };
    }),
  clearIdsToEdit: () => set(() => ({ idsToEdit: [] })),
}));
