import { create } from 'zustand';

type EventSettings = {
  showQuickEntry: boolean;
  startTimeIsLastEnd: boolean;
  defaultPublic: boolean;
};

type LocalEventStore = {
  eventSettings: EventSettings;
  setLocalEventSettings: (newState: EventSettings) => void;
  setShowQuickEntry: (showQuickEntry: boolean) => void;
  setStartTimeIsLastEnd: (startTimeIsLastEnd: boolean) => void;
  setDefaultPublic: (defaultPublic: boolean) => void;
};

export const useLocalEvent = create<LocalEventStore>((set) => ({
  eventSettings: {
    showQuickEntry: false,
    startTimeIsLastEnd: true,
    defaultPublic: true,
  },
  setLocalEventSettings: (value) => set(() => ({ eventSettings: value })),
  setShowQuickEntry: (showQuickEntry) =>
    set((state) => ({ eventSettings: { ...state.eventSettings, showQuickEntry } })),
  setStartTimeIsLastEnd: (startTimeIsLastEnd) =>
    set((state) => ({ eventSettings: { ...state.eventSettings, startTimeIsLastEnd } })),
  setDefaultPublic: (defaultPublic) => set((state) => ({ eventSettings: { ...state.eventSettings, defaultPublic } })),
}));
