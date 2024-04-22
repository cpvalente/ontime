import { create } from 'zustand';

import { booleanFromLocalStorage } from '../utils/localStorage';

type EditorSettingsStore = {
  defaultDuration: string;
  linkPrevious: boolean;
  defaultWarnTime: string;
  defaultDangerTime: string;
  defaultPublic: boolean;
  setDefaultDuration: (defaultDuration: string) => void;
  setLinkPrevious: (linkPrevious: boolean) => void;
  setWarnTime: (warnTime: string) => void;
  setDangerTime: (dangerTime: string) => void;
  setDefaultPublic: (defaultPublic: boolean) => void;
};

export const editorSettingsDefaults = {
  duration: '00:10:00',
  linkPrevious: true,
  warnTime: '00:02:00', // 120000 same as backend
  dangerTime: '00:01:00', // 60000 same as backend
  isPublic: true,
};

enum EditorSettingsKeys {
  DefaultDuration = 'ontime-default-duration',
  LinkPrevious = 'ontime-link-previous',
  DefaultWarnTime = 'ontime-default-warn-time',
  DefaultDangerTime = 'ontime-default-danger-time',
  DefaultPublic = 'ontime-default-public',
}

export const useEditorSettings = create<EditorSettingsStore>((set) => {
  return {
    defaultDuration: localStorage.getItem(EditorSettingsKeys.DefaultDuration) ?? editorSettingsDefaults.duration,
    linkPrevious: booleanFromLocalStorage(EditorSettingsKeys.LinkPrevious, editorSettingsDefaults.linkPrevious),
    defaultWarnTime: localStorage.getItem(EditorSettingsKeys.DefaultWarnTime) ?? editorSettingsDefaults.warnTime,
    defaultDangerTime: localStorage.getItem(EditorSettingsKeys.DefaultDangerTime) ?? editorSettingsDefaults.dangerTime,
    defaultPublic: booleanFromLocalStorage(EditorSettingsKeys.DefaultPublic, editorSettingsDefaults.isPublic),

    setDefaultDuration: (defaultDuration) =>
      set(() => {
        localStorage.setItem(EditorSettingsKeys.DefaultDuration, String(defaultDuration));
        return { defaultDuration };
      }),

    setLinkPrevious: (linkPrevious) =>
      set(() => {
        localStorage.setItem(EditorSettingsKeys.LinkPrevious, String(linkPrevious));
        return { linkPrevious };
      }),
    setWarnTime: (defaultWarnTime) =>
      set(() => {
        localStorage.setItem(EditorSettingsKeys.DefaultWarnTime, String(defaultWarnTime));
        return { defaultWarnTime };
      }),
    setDangerTime: (defaultDangerTime) =>
      set(() => {
        localStorage.setItem(EditorSettingsKeys.DefaultDangerTime, String(defaultDangerTime));
        return { defaultDangerTime };
      }),
    setDefaultPublic: (defaultPublic) =>
      set(() => {
        localStorage.setItem(EditorSettingsKeys.DefaultPublic, String(defaultPublic));
        return { defaultPublic };
      }),
  };
});
