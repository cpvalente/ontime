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
  eventToEdit: { id: string; index: number; anchor: boolean }[];
  isEventSelected: (id: string, index: number) => boolean;
  setMode: (mode: AppMode) => void;
  setEditMode: (mode: EditMode) => void;
  setEventsToEdit: (id: string, index: number) => void;
  clearEventsToEdit: () => void;
};

export const useAppMode = create<AppModeStore>()((set, get) => ({
  mode: getModeFromSession(),
  cursor: null,
  editMode: EditMode.Single,
  eventToEdit: [],
  setMode: (mode: AppMode) => {
    persistModeToSession(mode);

    return set(() => {
      return { mode };
    });
  },
  isEventSelected: (id, index) => {
    const { eventToEdit: eventsToEdit } = get();

    return eventsToEdit.some((event) => {
      const doesEventsHaveAnchor = eventsToEdit.some((event) => event.anchor);

      if (doesEventsHaveAnchor) {
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
    set(({ editMode, eventToEdit: eventsToEdit }) => {
      if (editMode === EditMode.Single) {
        return { eventToEdit: [{ id, index, anchor: false }] };
      }

      if (editMode === EditMode.CherryPick) {
        const uniqueEventsWithoutAnchor = eventsToEdit
          .map(({ id, index }) => ({ id, index, anchor: false }))
          // in case the user toggles the same event,
          // we can preemptively filter out duplicates
          .filter((event) => event.id !== id);

        if (uniqueEventsWithoutAnchor.length !== eventsToEdit.length) {
          return { eventToEdit: uniqueEventsWithoutAnchor };
        }

        return { eventToEdit: [...uniqueEventsWithoutAnchor, { id, index, anchor: false }] };
      }

      if (editMode === EditMode.Range) {
        const eventWithAnchor = eventsToEdit.find((id) => id.anchor);

        if (!eventWithAnchor) {
          if (eventsToEdit.length) {
            const firstEvent = eventsToEdit.at(0);

            if (!firstEvent) {
              return { eventToEdit: [{ id, index, anchor: true }] };
            }

            if (firstEvent.id === id) {
              return { eventToEdit: [{ ...firstEvent, anchor: true }] };
            }

            if (firstEvent.index > index) {
              return {
                eventToEdit: [
                  { id, index, anchor: false },
                  { ...firstEvent, anchor: true },
                ],
              };
            }

            return {
              eventToEdit: [
                { ...firstEvent, anchor: true },
                { id, index, anchor: false },
              ],
            };
          }

          return { eventToEdit: [{ id, index, anchor: true }] };
        }

        if (eventWithAnchor.id === id) {
          return { eventToEdit: [{ ...eventWithAnchor, anchor: true }] };
        }

        if (eventWithAnchor.index > index) {
          return {
            eventToEdit: [{ id, index, anchor: false }, eventWithAnchor],
          };
        }

        return {
          eventToEdit: [eventWithAnchor, { id, index, anchor: false }],
        };
      }

      return { eventToEdit: [] };
    }),
  clearEventsToEdit: () => set(() => ({ eventToEdit: [] })),
}));
