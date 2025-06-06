import { CustomFieldKey, EntryId, MaybeNumber } from 'ontime-types';

export type RundownMetadata = {
  totalDelay: number;
  totalDuration: number;
  totalDays: number;
  firstStart: MaybeNumber;
  lastEnd: MaybeNumber;

  playableEventOrder: EntryId[]; // flat order of playable events
  timedEventOrder: EntryId[]; // flat order of timed events
  flatEntryOrder: EntryId[]; // flat order of entries
};

export type AssignedMap = Record<CustomFieldKey, EntryId[]>;
export type CustomFieldsMetadata = {
  assigned: AssignedMap;
};
