import { create } from 'zustand';

import { booleanFromLocalStorage } from '../utils/localStorage';

type EditorSettings = {
  showQuickEntry: boolean;
  startTimeIsLastEnd: boolean;
  defaultPublic: boolean;
  showNif: boolean;
};

type EditorSettingsStore = {
  eventSettings: EditorSettings;
  setLocalEventSettings: (newState: EditorSettings) => void;
  setShowQuickEntry: (showQuickEntry: boolean) => void;
  setStartTimeIsLastEnd: (startTimeIsLastEnd: boolean) => void;
  setDefaultPublic: (defaultPublic: boolean) => void;
  setShowNif: (showNif: boolean) => void;
};

enum EditorSettingsKeys {
  ShowQuickEntry = 'ontime-show-quick-entry',
  StartTimeIsLastEnd = 'ontime-start-is-last-end',
  DefaultPublic = 'ontime-default-public',
  ShowNif = 'ontime-show-nif',
}

export const useEditorSettings = create<EditorSettingsStore>((set) => ({
  eventSettings: {
    showQuickEntry: booleanFromLocalStorage(EditorSettingsKeys.ShowQuickEntry, false),
    startTimeIsLastEnd: booleanFromLocalStorage(EditorSettingsKeys.ShowQuickEntry, true),
    defaultPublic: booleanFromLocalStorage(EditorSettingsKeys.ShowQuickEntry, true),
    showNif: booleanFromLocalStorage(EditorSettingsKeys.ShowNif, true),
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

  setShowNif: (showNif) =>
    set((state) => {
      localStorage.setItem(EditorSettingsKeys.ShowNif, String(showNif));
      return { eventSettings: { ...state.eventSettings, showNif } };
    }),
}));
