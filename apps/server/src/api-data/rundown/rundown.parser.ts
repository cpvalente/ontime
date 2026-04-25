import {
  CustomFieldKey,
  CustomFields,
  DatabaseModel,
  Day,
  EntryId,
  OntimeEntry,
  OntimeEvent,
  OntimeGroup,
  OntimeMilestone,
  PlayableEvent,
  ProjectRundowns,
  Rundown,
  RundownEntries,
  isOntimeDelay,
  isOntimeEvent,
  isOntimeGroup,
  isOntimeMilestone,
  isPlayableEvent,
} from 'ontime-types';
import {
  createDelay,
  createEvent,
  createGroup,
  createMilestone,
  generateId,
  getLinkedTimes,
  getTimeFrom,
  isNewLatest,
  isObjectEmpty,
} from 'ontime-utils';

import { makeNewRundown } from '../../models/dataModel.js';
import type { ErrorEmitter } from '../../utils/parserUtils.js';
import { RundownMetadata } from './rundown.types.js';
import { calculateDayOffset, cleanupCustomFields } from './rundown.utils.js';

/**
 * Parse a rundowns object along with the project custom fields
 * Returns a default rundown if none exists
 */
export function parseRundowns(
  data: Partial<DatabaseModel>,
  parsedCustomFields: Readonly<CustomFields>,
  emitError?: ErrorEmitter,
): ProjectRundowns {
  // ensure there is always a rundown to import
  // this is important since the rest of the app assumes this exist
  if (!data.rundowns || isObjectEmpty(data.rundowns)) {
    emitError?.('No data found to import');
    const defaultRundown = makeNewRundown();
    return {
      [defaultRundown.id]: defaultRundown,
    };
  }

  const parsedRundowns: ProjectRundowns = {};
  const iterableRundownsIds = Object.keys(data.rundowns);

  // parse all the rundowns individually
  for (const id of iterableRundownsIds) {
    console.log('Found rundown, importing...');
    const rundown = data.rundowns[id];
    const parsedRundown = parseRundown(rundown, parsedCustomFields, emitError);
    parsedRundowns[parsedRundown.id] = parsedRundown;
  }

  return parsedRundowns;
}

/**
 * Parses and validates a single project rundown along with given project custom fields
 */
export function parseRundown(
  rundown: Rundown,
  parsedCustomFields: Readonly<CustomFields>,
  emitError?: ErrorEmitter,
): Rundown {
  const parsedRundown: Rundown = {
    id: rundown.id || generateId(),
    title: rundown.title ?? '',
    entries: {},
    order: [],
    flatOrder: [],
    revision: rundown.revision ?? 1,
  };

  let eventIndex = 0;

  for (let i = 0; i < rundown.order.length; i++) {
    const entryId = rundown.order[i];
    const event = rundown.entries[entryId];

    if (!event) {
      emitError?.('Could not find referenced event, skipping');
      continue;
    }

    if (parsedRundown.order.includes(event.id)) {
      emitError?.('ID collision on event import, skipping');
      continue;
    }

    const id = entryId;
    let newEvent: OntimeEntry | null;
    const nestedEntryIds: string[] = [];

    if (isOntimeEvent(event)) {
      newEvent = createEvent(event, eventIndex);
      // skip if event is invalid
      if (newEvent == null) {
        emitError?.('Skipping event without payload');
        continue;
      }

      cleanupCustomFields(newEvent.custom, parsedCustomFields);
      eventIndex += 1;
    } else if (isOntimeDelay(event)) {
      newEvent = createDelay({ duration: event.duration, id });
    } else if (isOntimeMilestone(event)) {
      newEvent = createMilestone({ ...event, id });
      cleanupCustomFields(newEvent.custom, parsedCustomFields);
      /**
       * We leave here an entry point for blocks for the alpha testers, should remove this after a while
       */
      // @ts-expect-error -- we are checking a legacy type
    } else if (event.type === 'block' || isOntimeGroup(event)) {
      for (let i = 0; i < event.entries.length; i++) {
        const nestedEventId = event.entries[i];
        const nestedEvent = rundown.entries[nestedEventId];
        let newNestedEvent: OntimeEntry | null = null;

        if (isOntimeEvent(nestedEvent)) {
          newNestedEvent = createEvent(nestedEvent, eventIndex);

          // skip if event is invalid
          if (newNestedEvent == null) {
            emitError?.('Skipping event without payload');
            continue;
          }

          newNestedEvent.parent = event.id;
          cleanupCustomFields(newNestedEvent.custom, parsedCustomFields);
          eventIndex += 1;
        } else if (isOntimeDelay(nestedEvent)) {
          newNestedEvent = createDelay({ duration: nestedEvent.duration, id: nestedEventId });
          newNestedEvent.parent = event.id;
        } else if (isOntimeMilestone(nestedEvent)) {
          newNestedEvent = createMilestone({ ...nestedEvent, id: nestedEventId });
          newNestedEvent.parent = event.id;
          cleanupCustomFields(newNestedEvent.custom, parsedCustomFields);
        }

        if (newNestedEvent) {
          nestedEntryIds.push(nestedEventId);
          parsedRundown.entries[nestedEventId] = newNestedEvent;
        }
      }

      newEvent = createGroup({ ...structuredClone(event), id });
      // ensure entries exist
      if (event.entries?.length > 0) {
        newEvent.entries = event.entries.filter((eventId) => Object.hasOwn(rundown.entries, eventId));
      }
      // ensure custom fields are valid
      cleanupCustomFields(newEvent.custom, parsedCustomFields);
    } else {
      emitError?.('Unknown event type, skipping');
      continue;
    }

    if (newEvent) {
      parsedRundown.entries[id] = newEvent;
      parsedRundown.order.push(id);
      parsedRundown.flatOrder.push(id);
      parsedRundown.flatOrder.push(...nestedEntryIds);
    }
  }

  console.log(`Imported rundown ${parsedRundown.title} with ${parsedRundown.flatOrder.length} entries`);
  return parsedRundown;
}

/**
 * Ensures that custom fields have references
 * If a field is exists in the entry but not in the project customFields, it is deleted
 * Mutates the given event in place
 */
export function sanitiseCustomFields(customFields: CustomFields, entry: OntimeEvent | OntimeMilestone | OntimeGroup) {
  for (const field in entry.custom) {
    if (field in customFields) continue;
    delete entry.custom[field];
  }
  return entry;
}

export type ProcessedRundownMetadata = RundownMetadata & {
  entries: RundownEntries;
  order: EntryId[];
  previousEvent: PlayableEvent | null; // The playableEvent from the previous iteration
  latestEvent: PlayableEvent | null; // The playableEvent most forwards in time processed so far
  previousEntry: OntimeEntry | null; // The entry processed in the previous iteration
  assignedCustomFields: Record<CustomFieldKey, string[]>; // Custom fields assigned to events
};

/**
 * Factory function to create a rundown metadata processor
 *
 * @param customFields project custom fields used to sanitise entries
 * @param options.mutate when true, entries are mutated in place rather than cloned.
 *                      Callers must own (or have already cloned) the input rundown.
 * @returns process() - processes entries in order | getMetadata() returns the accumulated metadata
 */
export function makeRundownMetadata(customFields: CustomFields, options?: { mutate?: boolean }) {
  const mutate = options?.mutate ?? false;
  const rundownMeta: ProcessedRundownMetadata = {
    totalDelay: 0,
    totalDuration: 0,
    totalDays: 0,
    firstStart: null,
    lastEnd: null,

    assignedCustomFields: {},
    playableEventOrder: [],
    timedEventOrder: [],
    flatEntryOrder: [],
    flags: [],

    entries: {},
    order: [],
    previousEvent: null,
    latestEvent: null,
    previousEntry: null,
  };

  function process<T extends OntimeEntry>(entry: T, childOfGroup: EntryId | null): T {
    return processEntry(rundownMeta, customFields, mutate ? entry : structuredClone(entry), childOfGroup);
  }

  function getMetadata(): ProcessedRundownMetadata {
    return rundownMeta;
  }

  return { process, getMetadata };
}

/**
 * Processes a single entry, mutating both `entry` and `rundownMetadata` in place.
 * Returns the same `entry` reference for caller convenience.
 */
function processEntry<T extends OntimeEntry>(
  rundownMetadata: ProcessedRundownMetadata,
  customFields: CustomFields,
  entry: T,
  childOfGroup: EntryId | null,
): T {
  rundownMetadata.flatEntryOrder.push(entry.id);

  if (isOntimeEvent(entry)) {
    rundownMetadata.timedEventOrder.push(entry.id);

    /**
     * 1.Checks that link can be established (ie, events exist and are valid)
     * and populates the time data from link
     * The linked event is always the previous playable event
     * If no previous event exists, the link is removed
     */
    if (entry.linkStart) {
      if (rundownMetadata.previousEvent) {
        const timePatch = getLinkedTimes(entry, rundownMetadata.previousEvent);
        entry.timeStart = timePatch.timeStart;
        entry.timeEnd = timePatch.timeEnd;
        entry.duration = timePatch.duration;
      } else {
        entry.linkStart = false;
      }
    }

    // 2. handle custom fields - mutates entry
    sanitiseCustomFields(customFields, entry);

    rundownMetadata.totalDays += calculateDayOffset(entry, rundownMetadata.previousEvent);
    entry.dayOffset = rundownMetadata.totalDays as Day;
    entry.delay = 0; // this means we dont calculate delays or gaps for skipped events
    entry.gap = 0; // this means we dont calculate delays or gaps for skipped events
    entry.parent = childOfGroup;

    // update rundown metadata, it only concerns playable events
    if (isPlayableEvent(entry)) {
      rundownMetadata.playableEventOrder.push(entry.id);

      // first start is always the first event
      if (rundownMetadata.firstStart === null) {
        rundownMetadata.firstStart = entry.timeStart;
      }

      // check if event is flagged
      if (entry.flag) {
        rundownMetadata.flags.push(entry.id);
      }

      entry.gap = getTimeFrom(entry, rundownMetadata.latestEvent);

      if (entry.gap === 0) {
        // event starts on previous finish, we add its duration
        rundownMetadata.totalDuration += entry.duration;
      } else if (entry.gap > 0) {
        // event has a gap, we add the gap and the duration
        rundownMetadata.totalDuration += entry.gap + entry.duration;
      } else {
        // there is an overlap, we remove the overlap from the duration
        // ensuring that the sum is not negative (ie: fully overlapped events)
        // NOTE: we add the gap since it is a negative number
        rundownMetadata.totalDuration += Math.max(entry.duration + entry.gap, 0);
      }

      // remove eventual gaps from the accumulated delay
      // we only affect positive delays (time forwards)
      if (rundownMetadata.totalDelay > 0 && entry.gap > 0) {
        let correctedDelay = 0;
        // we need to separate the delay that is accumulated from one that may exist after the gap
        if (isOntimeDelay(rundownMetadata.previousEntry)) {
          correctedDelay = rundownMetadata.previousEntry.duration;
          rundownMetadata.totalDelay -= correctedDelay;
        }
        rundownMetadata.totalDelay = Math.max(rundownMetadata.totalDelay - entry.gap, 0);
        rundownMetadata.totalDelay += correctedDelay;
      }

      // current event delay is the current accumulated delay
      entry.delay = rundownMetadata.totalDelay;

      // assign data for next iteration
      rundownMetadata.previousEvent = entry;

      // lastEntry is the event with the latest end time
      if (isNewLatest(entry, rundownMetadata.latestEvent)) {
        rundownMetadata.latestEvent = entry;
        rundownMetadata.lastEnd = entry.timeEnd;
      }
    }
  } else if (isOntimeDelay(entry)) {
    // !!! this must happen after handling the links
    rundownMetadata.totalDelay += entry.duration;
    entry.parent = childOfGroup;
  }

  if (!childOfGroup) {
    rundownMetadata.order.push(entry.id);
  }
  rundownMetadata.entries[entry.id] = entry;
  rundownMetadata.previousEntry = entry;

  return entry;
}
