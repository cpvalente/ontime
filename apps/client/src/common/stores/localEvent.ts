import { create } from 'zustand';

import { booleanFromLocalStorage } from '../utils/localStorage';

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

enum LocalEventKeys {
  ShowQuickEntry = 'ontime-show-quick-entry',
  StartTimeIsLastEnd = 'ontime-start-is-last-end',
  DefaultPublic = 'ontime-default-public',
}

export const useLocalEvent = create<LocalEventStore>((set) => ({
  eventSettings: {
    showQuickEntry: booleanFromLocalStorage(LocalEventKeys.ShowQuickEntry, false),
    startTimeIsLastEnd: booleanFromLocalStorage(LocalEventKeys.ShowQuickEntry, true),
    defaultPublic: booleanFromLocalStorage(LocalEventKeys.ShowQuickEntry, true),
  },

  setLocalEventSettings: (value) =>
    set(() => {
      localStorage.setItem(LocalEventKeys.ShowQuickEntry, String(value.showQuickEntry));
      localStorage.setItem(LocalEventKeys.StartTimeIsLastEnd, String(value.startTimeIsLastEnd));
      localStorage.setItem(LocalEventKeys.DefaultPublic, String(value.defaultPublic));
      return { eventSettings: value };
    }),

  setShowQuickEntry: (showQuickEntry) =>
    set((state) => {
      localStorage.setItem(LocalEventKeys.ShowQuickEntry, String(showQuickEntry));
      return { eventSettings: { ...state.eventSettings, showQuickEntry } };
    }),

  setStartTimeIsLastEnd: (startTimeIsLastEnd) =>
    set((state) => {
      localStorage.setItem(LocalEventKeys.StartTimeIsLastEnd, String(startTimeIsLastEnd));
      return { eventSettings: { ...state.eventSettings, startTimeIsLastEnd } };
    }),

  setDefaultPublic: (defaultPublic) =>
    set((state) => {
      localStorage.setItem(LocalEventKeys.DefaultPublic, String(defaultPublic));
      return { eventSettings: { ...state.eventSettings, defaultPublic } };
    }),
}));
