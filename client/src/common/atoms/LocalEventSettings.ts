import { atomWithStorage, selectAtom } from 'jotai/utils';

export const eventSettingsAtom = atomWithStorage('ontime-eventSettings', {
  showQuickEntry: false,
  startTimeIsLastEnd: false,
  defaultPublic: false,
});

export const showQuickEntryAtom = selectAtom(
  eventSettingsAtom,
  (settings) => settings.showQuickEntry
);
export const startTimeIsLastEndAtom = selectAtom(
  eventSettingsAtom,
  (settings) => settings.startTimeIsLastEnd
);
export const defaultPublicAtom = selectAtom(
  eventSettingsAtom,
  (settings) => settings.defaultPublic
);
