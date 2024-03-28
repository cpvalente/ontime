import { create } from 'zustand';

import { booleanFromLocalStorage } from '../utils/localStorage';

type EditorSettings = {
  showQuickEntry: boolean;
  linkPrevious: boolean;
  defaultPublic: boolean;
  defaultDuration: string;
};

type EditorSettingsStore = {
  eventSettings: EditorSettings;
  setLocalEventSettings: (newState: EditorSettings) => void;
  setShowQuickEntry: (showQuickEntry: boolean) => void;
  setLinkPrevious: (linkPrevious: boolean) => void;
  setDefaultPublic: (defaultPublic: boolean) => void;
  setDefaultDuration: (defaultDuration: string) => void;
};

enum EditorSettingsKeys {
  ShowQuickEntry = 'ontime-show-quick-entry',
  LinkPrevious = 'ontime-link-previous',
  DefaultPublic = 'ontime-default-public',
  DefaultDuration = 'ontime-default-duration',
}

export const useEditorSettings = create<EditorSettingsStore>((set) => ({
  eventSettings: {
    showQuickEntry: booleanFromLocalStorage(EditorSettingsKeys.ShowQuickEntry, false),
    linkPrevious: booleanFromLocalStorage(EditorSettingsKeys.LinkPrevious, true),
    defaultPublic: booleanFromLocalStorage(EditorSettingsKeys.DefaultPublic, true),
    defaultDuration: localStorage.getItem(EditorSettingsKeys.DefaultDuration) ?? '00:10:00',
  },

  setLocalEventSettings: (value) =>
    set(() => {
      localStorage.setItem(EditorSettingsKeys.ShowQuickEntry, String(value.showQuickEntry));
      localStorage.setItem(EditorSettingsKeys.LinkPrevious, String(value.linkPrevious));
      localStorage.setItem(EditorSettingsKeys.DefaultPublic, String(value.defaultPublic));
      return { eventSettings: value };
    }),

  setShowQuickEntry: (showQuickEntry) =>
    set((state) => {
      localStorage.setItem(EditorSettingsKeys.ShowQuickEntry, String(showQuickEntry));
      return { eventSettings: { ...state.eventSettings, showQuickEntry } };
    }),

  setLinkPrevious: (linkPrevious) =>
    set((state) => {
      localStorage.setItem(EditorSettingsKeys.LinkPrevious, String(linkPrevious));
      return { eventSettings: { ...state.eventSettings, linkPrevious } };
    }),

  setDefaultPublic: (defaultPublic) =>
    set((state) => {
      localStorage.setItem(EditorSettingsKeys.DefaultPublic, String(defaultPublic));
      return { eventSettings: { ...state.eventSettings, defaultPublic } };
    }),

  setDefaultDuration: (defaultDuration) =>
    set((state) => {
      localStorage.setItem(EditorSettingsKeys.DefaultDuration, String(defaultDuration));
      return { eventSettings: { ...state.eventSettings, defaultDuration } };
    }),
}));
