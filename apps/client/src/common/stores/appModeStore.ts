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

export type EventToEdit = { id: string; index: number; anchor: boolean };

type AppModeStore = {
  mode: AppMode;
  cursor: string | null;
  editMode: EditMode;
  eventsToEdit: EventToEdit[];
  isEventSelected: (id: string, index: number, isIndividual?: boolean) => boolean;
  setMode: (mode: AppMode) => void;
  setEditMode: (mode: EditMode) => void;
  setEventsToEdit: (id: string, index: number) => void;
  clearEventsToEdit: () => void;
};

export const useAppMode = create<AppModeStore>()((set, get) => ({
  mode: getModeFromSession(),
  cursor: null,
  editMode: EditMode.Single,
  eventsToEdit: [],
  setMode: (mode: AppMode) => {
    persistModeToSession(mode);

    return set(() => {
      return { mode };
    });
  },
  isEventSelected: (id, index, isIndividual = false) => {
    const { eventsToEdit } = get();

    if (isIndividual && eventsToEdit.length > 1) {
      return false;
    }

    return eventsToEdit.some((event) => {
      const isAnchorPresent = eventsToEdit.some((event) => event.anchor);

      if (isAnchorPresent) {
        const firstSelectedEvent = eventsToEdit.at(0);
        const lastSelectedEvent = eventsToEdit.at(-1);

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
  setEventsToEdit: (id, index) =>
    set(({ editMode, eventsToEdit }) => {
      if (editMode === EditMode.Single) {
        return { eventsToEdit: [{ id, index, anchor: false }] };
      }

      if (editMode === EditMode.CherryPick) {
        const uniqueEventsWithoutAnchor = eventsToEdit
          .map(({ id, index }) => ({ id, index, anchor: false }))
          // in case the user toggles the same event,
          // we can preemptively filter out duplicates
          .filter((event) => event.id !== id);

        if (uniqueEventsWithoutAnchor.length !== eventsToEdit.length) {
          return { eventsToEdit: uniqueEventsWithoutAnchor };
        }

        return { eventsToEdit: [...uniqueEventsWithoutAnchor, { id, index, anchor: false }] };
      }

      if (editMode === EditMode.Range) {
        const eventWithAnchor = eventsToEdit.find((id) => id.anchor);

        if (!eventWithAnchor) {
          if (eventsToEdit.length) {
            const firstEvent = eventsToEdit.at(0);

            if (!firstEvent) {
              return { eventsToEdit: [{ id, index, anchor: true }] };
            }

            if (firstEvent.id === id) {
              return { eventsToEdit: [{ ...firstEvent, anchor: true }] };
            }

            if (firstEvent.index > index) {
              return {
                eventsToEdit: [
                  { id, index, anchor: false },
                  { ...firstEvent, anchor: true },
                ],
              };
            }

            return {
              eventsToEdit: [
                { ...firstEvent, anchor: true },
                { id, index, anchor: false },
              ],
            };
          }

          return { eventsToEdit: [{ id, index, anchor: true }] };
        }

        if (eventWithAnchor.id === id) {
          return { eventsToEdit: [{ ...eventWithAnchor, anchor: true }] };
        }

        if (eventWithAnchor.index > index) {
          return {
            eventsToEdit: [{ id, index, anchor: false }, eventWithAnchor],
          };
        }

        return {
          eventsToEdit: [eventWithAnchor, { id, index, anchor: false }],
        };
      }

      return { eventsToEdit: [] };
    }),
  clearEventsToEdit: () => set(() => ({ eventsToEdit: [] })),
}));
