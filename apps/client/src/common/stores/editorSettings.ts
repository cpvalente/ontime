import { create } from 'zustand';

import { booleanFromLocalStorage } from '../utils/localStorage';

type EditorSettings = {
  showQuickEntry: boolean;
  startTimeIsLastEnd: boolean;
  defaultPublic: boolean;
};

type EditorSettingsStore = {
  eventSettings: EditorSettings;
  setLocalEventSettings: (newState: EditorSettings) => void;
  setShowQuickEntry: (showQuickEntry: boolean) => void;
  setStartTimeIsLastEnd: (startTimeIsLastEnd: boolean) => void;
  setDefaultPublic: (defaultPublic: boolean) => void;
};

enum EditorSettingsKeys {
  ShowQuickEntry = 'ontime-show-quick-entry',
  StartTimeIsLastEnd = 'ontime-start-is-last-end',
  DefaultPublic = 'ontime-default-public',
}

export const useEditorSettings = create<EditorSettingsStore>((set) => ({
  eventSettings: {
    showQuickEntry: booleanFromLocalStorage(EditorSettingsKeys.ShowQuickEntry, false),
    startTimeIsLastEnd: booleanFromLocalStorage(EditorSettingsKeys.ShowQuickEntry, true),
    defaultPublic: booleanFromLocalStorage(EditorSettingsKeys.ShowQuickEntry, true),
  },

  setLocalEventSettings: (value) =>
    set(() => {
      localStorage.setItem(EditorSettingsKeys.ShowQuickEntry, String(value.showQuickEntry));
      localStorage.setItem(EditorSettingsKeys.StartTimeIsLastEnd, String(value.startTimeIsLastEnd));
      localStorage.setItem(EditorSettingsKeys.DefaultPublic, String(value.defaultPublic));
      return { eventSettings: value };
    }),

  setShowQuickEntry: (showQuickEntry) =>
    set((state) => {
      localStorage.setItem(EditorSettingsKeys.ShowQuickEntry, String(showQuickEntry));
      return { eventSettings: { ...state.eventSettings, showQuickEntry } };
    }),

  setStartTimeIsLastEnd: (startTimeIsLastEnd) =>
    set((state) => {
      localStorage.setItem(EditorSettingsKeys.StartTimeIsLastEnd, String(startTimeIsLastEnd));
      return { eventSettings: { ...state.eventSettings, startTimeIsLastEnd } };
    }),

  setDefaultPublic: (defaultPublic) =>
    set((state) => {
      localStorage.setItem(EditorSettingsKeys.DefaultPublic, String(defaultPublic));
      return { eventSettings: { ...state.eventSettings, defaultPublic } };
    }),
}));
