import { create } from 'zustand';

import { booleanFromLocalStorage } from '../utils/localStorage';

type EditorSettings = {
  showQuickEntry: boolean;
  linkPrevious: boolean;
  defaultPublic: boolean;
};

type EditorSettingsStore = {
  eventSettings: EditorSettings;
  setLocalEventSettings: (newState: EditorSettings) => void;
  setShowQuickEntry: (showQuickEntry: boolean) => void;
  setLinkPrevious: (linkPrevious: boolean) => void;
  setDefaultPublic: (defaultPublic: boolean) => void;
};

enum EditorSettingsKeys {
  ShowQuickEntry = 'ontime-show-quick-entry',
  LinkPrevious = 'ontime-link-previous',
  DefaultPublic = 'ontime-default-public',
}

export const useEditorSettings = create<EditorSettingsStore>((set) => ({
  eventSettings: {
    showQuickEntry: booleanFromLocalStorage(EditorSettingsKeys.ShowQuickEntry, false),
    linkPrevious: booleanFromLocalStorage(EditorSettingsKeys.LinkPrevious, true),
    defaultPublic: booleanFromLocalStorage(EditorSettingsKeys.DefaultPublic, true),
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
}));
