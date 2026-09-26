import type { EntryId, OntimeEntry } from '../../definitions/core/OntimeEntry.js';
import type { MaybeNumber } from '../../utils/utils.type.js';

export type PatchWithId<T extends OntimeEntry = OntimeEntry> = Partial<T> & { id: EntryId };

export type InsertOptions = {
  after?: EntryId | true;
  before?: EntryId | true;
};

export type EventPostPayload = Partial<OntimeEntry> & InsertOptions;

export type TransientEventPayload = Partial<OntimeEntry> & InsertOptions;

/**
 * Pastes entries from the clipboard into a rundown, as one contiguous block
 * The anchor is optional, without it the block is added at the end of the rundown
 */
export type PasteEntriesPayload = {
  /** rundown the entries were copied from, ids are only unique within a rundown */
  sourceRundownId: string;
  entryIds: EntryId[];
  /** copy clones the entries, cut moves them */
  mode: 'copy' | 'cut';
  after?: EntryId;
  before?: EntryId;
};

export type ProjectRundown = {
  id: string;
  title: string;
  numEntries: number;
  revision: number;
};

export type ProjectRundownsList = {
  loaded: string;
  rundowns: ProjectRundown[];
};

export type RundownSummary = {
  duration: number;
  start: MaybeNumber;
  end: MaybeNumber;
};

export type RenumberCues = {
  ids: EntryId[];
  prefix: string;
  start: string;
  increment: string;
};
