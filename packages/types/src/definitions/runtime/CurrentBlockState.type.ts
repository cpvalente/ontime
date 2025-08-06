import type { MaybeNumber } from '../../utils/utils.type.js';
import type { EntryId } from '../core/OntimeEntry.js';

export type CurrentBlockState = {
  id: EntryId;
  startedAt: MaybeNumber;
  expectedEnd: MaybeNumber;
};

export type UpcomingEntry = {
  id: EntryId;
  start: number;
};

export type EntryMetaData = {
  id: EntryId;
  actualStart: MaybeNumber;
  expectedStart: MaybeNumber;
  expectedEnd: MaybeNumber;
};
