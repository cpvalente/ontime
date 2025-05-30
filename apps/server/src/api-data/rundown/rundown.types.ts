import { CustomFieldLabel, EntryId, MaybeNumber } from 'ontime-types';

export type RundownMetadata = {
  totalDelay: number;
  totalDuration: number;
  totalDays: number;
  firstStart: MaybeNumber;
  lastEnd: MaybeNumber;

  playableEventOrder: EntryId[]; // flat order of playable events
  timedEventOrder: EntryId[]; // flat order of timed events
  flatEntryOrder: EntryId[]; // flat order of entries

  /**
   * Keep track of which custom fields are used.
   * This will be handy for when we delete custom fields
   * since we can clear the custom fields from every event where they are used
   */
  assignedCustomFields: Record<CustomFieldLabel, string[]>;
};
