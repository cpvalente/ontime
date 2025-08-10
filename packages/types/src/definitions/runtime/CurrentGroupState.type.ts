import type { MaybeNumber } from '../../utils/utils.type.js';
import type { EntryId } from '../core/OntimeEntry.js';

export type GroupState = {
  id: EntryId;
  startedAt: MaybeNumber;
  expectedEnd: MaybeNumber;
};

export type UpcomingEntry = {
  id: EntryId;
  expectedStart: MaybeNumber;
};
