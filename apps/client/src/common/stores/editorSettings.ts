import { create } from 'zustand';

import { booleanFromLocalStorage, numberFromLocalStorage } from '../utils/localStorage';

type EditorSettings = {
  showQuickEntry: boolean;
  addTimeAmounts: {
    a: number;
    b: number;
    c: number;
    d: number;
    aShift: number;
    bShift: number;
    cShift: number;
    dShift: number;
  };
  startTimeIsLastEnd: boolean;
  defaultPublic: boolean;
  showNif: boolean;
};

type EditorSettingsStore = {
  eventSettings: EditorSettings;
  setLocalEventSettings: (newState: EditorSettings) => void;
  setShowQuickEntry: (showQuickEntry: boolean) => void;
  setAddtimeamounts: (addTimeAmounts: EditorSettings['addTimeAmounts']) => void;
  setStartTimeIsLastEnd: (startTimeIsLastEnd: boolean) => void;
  setDefaultPublic: (defaultPublic: boolean) => void;
  setShowNif: (showNif: boolean) => void;
};

enum EditorSettingsKeys {
  ShowQuickEntry = 'ontime-show-quick-entry',
  AddTimeAmounts = 'ontime-addtime-amounts',
  StartTimeIsLastEnd = 'ontime-start-is-last-end',
  DefaultPublic = 'ontime-default-public',
  ShowNif = 'ontime-show-nif',
}

export const useEditorSettings = create<EditorSettingsStore>((set) => ({
  eventSettings: {
    showQuickEntry: booleanFromLocalStorage(EditorSettingsKeys.ShowQuickEntry, false),
    addTimeAmounts: {
      a: numberFromLocalStorage(`${EditorSettingsKeys.AddTimeAmounts}a`, 60),
      b: numberFromLocalStorage(`${EditorSettingsKeys.AddTimeAmounts}b`, -60),
      c: numberFromLocalStorage(`${EditorSettingsKeys.AddTimeAmounts}c`, 5 * 60),
      d: numberFromLocalStorage(`${EditorSettingsKeys.AddTimeAmounts}d`, -5 * 60),
      aShift: numberFromLocalStorage(`${EditorSettingsKeys.AddTimeAmounts}aShift`, 10),
      bShift: numberFromLocalStorage(`${EditorSettingsKeys.AddTimeAmounts}bShift`, -10),
      cShift: numberFromLocalStorage(`${EditorSettingsKeys.AddTimeAmounts}cShift`, 30),
      dShift: numberFromLocalStorage(`${EditorSettingsKeys.AddTimeAmounts}dShift`, -30),
    },
    startTimeIsLastEnd: booleanFromLocalStorage(EditorSettingsKeys.ShowQuickEntry, true),
    defaultPublic: booleanFromLocalStorage(EditorSettingsKeys.ShowQuickEntry, true),
    showNif: booleanFromLocalStorage(EditorSettingsKeys.ShowNif, true),
  },

  setLocalEventSettings: (value) =>
    set(() => {
      localStorage.setItem(EditorSettingsKeys.ShowQuickEntry, String(value.showQuickEntry));

      localStorage.setItem(`${EditorSettingsKeys.AddTimeAmounts}a`, String(value.addTimeAmounts.a));
      localStorage.setItem(`${EditorSettingsKeys.AddTimeAmounts}b`, String(value.addTimeAmounts.b));
      localStorage.setItem(`${EditorSettingsKeys.AddTimeAmounts}c`, String(value.addTimeAmounts.c));
      localStorage.setItem(`${EditorSettingsKeys.AddTimeAmounts}d`, String(value.addTimeAmounts.d));

      localStorage.setItem(EditorSettingsKeys.StartTimeIsLastEnd, String(value.startTimeIsLastEnd));
      localStorage.setItem(EditorSettingsKeys.DefaultPublic, String(value.defaultPublic));
      return { eventSettings: value };
    }),

  setShowQuickEntry: (showQuickEntry) =>
    set((state) => {
      localStorage.setItem(EditorSettingsKeys.ShowQuickEntry, String(showQuickEntry));
      return { eventSettings: { ...state.eventSettings, showQuickEntry } };
    }),

  setAddtimeamounts: (addTimeAmounts: EditorSettings['addTimeAmounts']) =>
    set((state) => {
      localStorage.setItem(`${EditorSettingsKeys.AddTimeAmounts}a`, String(addTimeAmounts.a));
      localStorage.setItem(`${EditorSettingsKeys.AddTimeAmounts}b`, String(addTimeAmounts.b));
      localStorage.setItem(`${EditorSettingsKeys.AddTimeAmounts}c`, String(addTimeAmounts.c));
      localStorage.setItem(`${EditorSettingsKeys.AddTimeAmounts}d`, String(addTimeAmounts.d));
      localStorage.setItem(`${EditorSettingsKeys.AddTimeAmounts}aShift`, String(addTimeAmounts.aShift));
      localStorage.setItem(`${EditorSettingsKeys.AddTimeAmounts}bShift`, String(addTimeAmounts.bShift));
      localStorage.setItem(`${EditorSettingsKeys.AddTimeAmounts}cShift`, String(addTimeAmounts.cShift));
      localStorage.setItem(`${EditorSettingsKeys.AddTimeAmounts}dShift`, String(addTimeAmounts.dShift));
      return { eventSettings: { ...state.eventSettings, addTimeAmounts } };
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
