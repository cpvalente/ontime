import {
  EntryId,
  EventPostPayload,
  InsertOptions,
  OntimeDelay,
  OntimeEntry,
  OntimeEvent,
  OntimeGroup,
  OntimeMilestone,
  PatchWithId,
  ProjectRundowns,
  Rundown,
  SupportedEntry,
} from 'ontime-types';

import { getCurrentRundown, getCurrentRundownId, getProjectCustomFields } from '../api-data/rundown/rundown.dao.js';
import {
  addEntry,
  batchEditEntries,
  deleteEntries,
  editEntry,
  reorderEntry,
} from '../api-data/rundown/rundown.service.js';
import { normalisedToRundownArray } from '../api-data/rundown/rundown.utils.js';
import { getDataProvider } from '../classes/data-provider/DataProvider.js';

export type EventFieldArgs = Partial<
  Pick<
    OntimeEvent,
    | 'cue'
    | 'title'
    | 'note'
    | 'colour'
    | 'skip'
    | 'flag'
    | 'custom'
    | 'timerType'
    | 'endAction'
    | 'linkStart'
    | 'countToEnd'
    | 'timeStrategy'
    | 'timeWarning'
    | 'timeDanger'
    | 'timeStart'
    | 'timeEnd'
    | 'duration'
  >
>;
export type MilestoneFieldArgs = Partial<Pick<OntimeMilestone, 'cue' | 'title' | 'note' | 'colour' | 'custom'>>;
export type DelayFieldArgs = Partial<Pick<OntimeDelay, 'duration'>>;
export type GroupFieldArgs = Partial<Pick<OntimeGroup, 'title' | 'note' | 'colour' | 'targetDuration' | 'custom'>>;

export type EntryFieldArgs = EventFieldArgs & MilestoneFieldArgs & DelayFieldArgs & GroupFieldArgs;
export type TargetRundownArgs = { rundownId?: string };
export type CreateEntryArgs = EntryFieldArgs & InsertOptions & TargetRundownArgs & { type?: `${SupportedEntry}` };
export type UpdateEntryArgs = EntryFieldArgs & TargetRundownArgs & { id: EntryId };

export function resolveTargetRundownId(args: TargetRundownArgs): string {
  return args.rundownId ?? getCurrentRundownId();
}

function getTargetMeta(rundownId: string) {
  const loaded = rundownId === getCurrentRundownId();
  return { rundownId, loaded };
}

export function getRundownById(rundownId?: string): Readonly<Rundown> {
  const targetId = rundownId ?? getCurrentRundownId();
  return targetId === getCurrentRundownId() ? getCurrentRundown() : getDataProvider().getRundown(targetId);
}

export function findEntry(args: TargetRundownArgs & { id?: EntryId; cue?: string }): OntimeEntry | undefined {
  const rundown = getRundownById(args.rundownId);
  if (args.id) {
    return rundown.entries[args.id];
  }
  if (args.cue) {
    return Object.values(rundown.entries).find((entry) => 'cue' in entry && entry.cue === args.cue);
  }
}

export function toRundownList(projectRundowns: Readonly<ProjectRundowns>) {
  return { loaded: getCurrentRundownId(), rundowns: normalisedToRundownArray(projectRundowns) };
}

export function assertKnownCustomFields(...customValues: Array<EntryFieldArgs['custom'] | undefined>) {
  const customFields = getProjectCustomFields();
  const knownKeys = new Set(Object.keys(customFields));
  const unknownKeys = new Set<string>();

  for (const custom of customValues) {
    if (!custom) continue;
    for (const key of Object.keys(custom)) {
      if (!knownKeys.has(key)) {
        unknownKeys.add(key);
      }
    }
  }

  if (unknownKeys.size > 0) {
    const keys = [...unknownKeys].join(', ');
    throw new Error(`Unknown custom field key(s): ${keys}. Call ontime_get_custom_fields to list available keys.`);
  }
}

/** Translates tool arguments into the payload consumed by rundown.service addEntry */
export function toEntryPayload(args: CreateEntryArgs): EventPostPayload {
  const { type = SupportedEntry.Event, after, before } = args;

  switch (type) {
    case SupportedEntry.Delay:
      return { type: SupportedEntry.Delay, duration: args.duration, after, before };
    case SupportedEntry.Milestone: {
      const { cue, title, note, colour, custom } = args;
      return { type: SupportedEntry.Milestone, cue, title, note, colour, custom, after, before };
    }
    case SupportedEntry.Group:
      // group creation currently only accepts a title, see generateEvent in rundown.utils.ts
      return { type: SupportedEntry.Group, title: args.title, after, before };
    case SupportedEntry.Event: {
      const { type: _type, rundownId: _rundownId, ...eventFields } = args;
      return { type: SupportedEntry.Event, ...eventFields };
    }
    default:
      throw new Error(`Invalid entry type: ${String(type)}`);
  }
}

export async function createEntryForMcp(args: CreateEntryArgs) {
  assertKnownCustomFields(args.custom);
  const rundownId = resolveTargetRundownId(args);
  const entry = await addEntry(rundownId, toEntryPayload(args));
  return { target: getTargetMeta(rundownId), entry };
}

export async function updateEntryForMcp(args: UpdateEntryArgs) {
  assertKnownCustomFields(args.custom);
  const rundownId = resolveTargetRundownId(args);
  const { rundownId: _rundownId, ...patch } = args;
  const entry = await editEntry(rundownId, patch as PatchWithId);
  return { target: getTargetMeta(rundownId), entry };
}

export async function deleteEntriesForMcp(args: TargetRundownArgs & { ids: EntryId[] }) {
  const rundownId = resolveTargetRundownId(args);
  const rundown = await deleteEntries(rundownId, args.ids);
  return { target: getTargetMeta(rundownId), deleted: args.ids, order: rundown.order };
}

export async function reorderEntryForMcp(
  args: TargetRundownArgs & { entryId: EntryId; destinationId: EntryId; order: 'before' | 'after' | 'insert' },
) {
  const rundownId = resolveTargetRundownId(args);
  const rundown = await reorderEntry(rundownId, args.entryId, args.destinationId, args.order);
  return { target: getTargetMeta(rundownId), order: rundown.order };
}

export async function batchCreateEntriesForMcp(
  args: TargetRundownArgs & { entries: CreateEntryArgs[]; after?: EntryId },
) {
  const { entries = [], after } = args;
  assertKnownCustomFields(...entries.map((entry) => entry.custom));
  const rundownId = resolveTargetRundownId(args);
  let previousId = after;
  const created: OntimeEntry[] = [];

  for (const entryArgs of entries) {
    const payload = toEntryPayload(entryArgs);
    // eslint-disable-next-line no-await-in-loop -- each entry chains after the previously created one
    const entry = await addEntry(rundownId, previousId ? { ...payload, after: previousId } : payload);
    created.push(entry);
    previousId = entry.id;
  }

  return { target: getTargetMeta(rundownId), created };
}

export async function batchUpdateEntriesForMcp(args: TargetRundownArgs & { ids: EntryId[]; data: EntryFieldArgs }) {
  assertKnownCustomFields(args.data.custom);
  const rundownId = resolveTargetRundownId(args);
  const rundown = await batchEditEntries(rundownId, args.ids, args.data);
  return { target: getTargetMeta(rundownId), updated: args.ids, order: rundown.order };
}
