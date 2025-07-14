import {
  DatabaseModel,
  CustomFields,
  ProjectRundowns,
  Rundown,
  OntimeEvent,
  isOntimeEvent,
  isOntimeDelay,
  isOntimeBlock,
  CustomFieldKey,
  EntryId,
  OntimeEntry,
  PlayableEvent,
  RundownEntries,
  isPlayableEvent,
  isOntimeMilestone,
} from 'ontime-types';
import { isObjectEmpty, generateId, getLinkedTimes, getTimeFrom, isNewLatest } from 'ontime-utils';

import { defaultRundown } from '../../models/dataModel.js';
import { delay as delayDef } from '../../models/eventsDefinition.js';
import type { ErrorEmitter } from '../../utils/parserUtils.js';

import { calculateDayOffset, cleanupCustomFields, createBlock, createEvent, createMilestone } from './rundown.utils.js';
import { RundownMetadata } from './rundown.types.js';

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
    return {
      [defaultRundown.id]: {
        ...defaultRundown,
      },
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
      newEvent = { ...delayDef, duration: event.duration, id };
    } else if (isOntimeMilestone(event)) {
      newEvent = createMilestone({ ...event, id });
      cleanupCustomFields(newEvent.custom, parsedCustomFields);
    } else if (isOntimeBlock(event)) {
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

          cleanupCustomFields(newNestedEvent.custom, parsedCustomFields);
          eventIndex += 1;
        } else if (isOntimeDelay(nestedEvent)) {
          newNestedEvent = { ...delayDef, duration: nestedEvent.duration, id: nestedEventId };
        } else if (isOntimeMilestone(nestedEvent)) {
          newNestedEvent = createMilestone({ ...nestedEvent, id: nestedEventId });
          cleanupCustomFields(newNestedEvent.custom, parsedCustomFields);
        }

        if (newNestedEvent) {
          nestedEntryIds.push(nestedEventId);
          parsedRundown.entries[nestedEventId] = newNestedEvent;
        }
      }

      newEvent = createBlock({ ...structuredClone(event), id });
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
 * Utility function to add an entry, mutates given assignedCustomFields in place
 * @param label
 * @param eventId
 */
export function addToCustomAssignment(
  key: CustomFieldKey,
  eventId: EntryId,
  assignedCustomFields: Record<string, string[]>,
) {
  if (!Array.isArray(assignedCustomFields[key])) {
    assignedCustomFields[key] = [];
  }
  assignedCustomFields[key].push(eventId);
}

/**
 * Keeps track of which custom fields are assigned to which events
 * Mutates the given assignedCustomFields in place
 * If a field is referenced but is not in the customFields map, it is deleted
 */
export function handleCustomField(
  customFields: CustomFields,
  event: OntimeEvent,
  assignedCustomFields: Record<CustomFieldKey, EntryId[]>,
) {
  for (const field in event.custom) {
    if (field in customFields) {
      // add field to assignment map
      addToCustomAssignment(field, event.id, assignedCustomFields);
    } else {
      // delete data if it is not declared in project level custom fields
      delete event.custom[field];
    }
  }
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
 * @returns {process, getMetadata} process() - processes entries in order | getMetadata() -> returns the current metadata
 */
export function makeRundownMetadata(customFields: CustomFields) {
  let rundownMeta: ProcessedRundownMetadata = {
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

  function process<T extends OntimeEntry>(
    entry: T,
    childOfBlock: EntryId | null,
  ): { processedData: ProcessedRundownMetadata; processedEntry: T } {
    const data = processEntry(rundownMeta, customFields, entry, childOfBlock);
    rundownMeta = data.processedData;
    return data;
  }

  function getMetadata(): ProcessedRundownMetadata {
    return rundownMeta;
  }

  return { process, getMetadata };
}

/**
 * Processes a single entry and updates the rundown metadata
 */
function processEntry<T extends OntimeEntry>(
  rundownMetadata: ProcessedRundownMetadata,
  customFields: CustomFields,
  entry: T,
  childOfBlock: EntryId | null,
): { processedData: ProcessedRundownMetadata; processedEntry: T } {
  const processedData = { ...rundownMetadata };
  const currentEntry = structuredClone(entry);
  processedData.flatEntryOrder.push(currentEntry.id);

  if (isOntimeEvent(currentEntry)) {
    processedData.timedEventOrder.push(currentEntry.id);

    /**
     * 1.Checks that link can be established (ie, events exist and are valid)
     * and populates the time data from link
     * The linked event is always the previous playable event
     * If no previous event exists, the link is removed
     */
    if (currentEntry.linkStart) {
      if (processedData.previousEvent) {
        const timePatch = getLinkedTimes(currentEntry, processedData.previousEvent);
        currentEntry.timeStart = timePatch.timeStart;
        currentEntry.timeEnd = timePatch.timeEnd;
        currentEntry.duration = timePatch.duration;
      } else {
        currentEntry.linkStart = false;
      }
    }

    // 2. handle custom fields - mutates currentEntry
    handleCustomField(customFields, currentEntry, processedData.assignedCustomFields);

    processedData.totalDays += calculateDayOffset(currentEntry, processedData.previousEvent);
    currentEntry.dayOffset = processedData.totalDays;
    currentEntry.delay = 0; // this means we dont calculate delays or gaps for skipped events
    currentEntry.gap = 0; // this means we dont calculate delays or gaps for skipped events
    currentEntry.parent = childOfBlock;

    // update rundown metadata, it only concerns playable events
    if (isPlayableEvent(currentEntry)) {
      processedData.playableEventOrder.push(currentEntry.id);

      // first start is always the first event
      if (processedData.firstStart === null) {
        processedData.firstStart = currentEntry.timeStart;
      }

      // check if event is flagged
      if (currentEntry.flag) {
        processedData.flags.push(currentEntry.id);
      }

      currentEntry.gap = getTimeFrom(currentEntry, processedData.latestEvent);

      if (currentEntry.gap === 0) {
        // event starts on previous finish, we add its duration
        processedData.totalDuration += currentEntry.duration;
      } else if (currentEntry.gap > 0) {
        // event has a gap, we add the gap and the duration
        processedData.totalDuration += currentEntry.gap + currentEntry.duration;
      } else if (currentEntry.gap < 0) {
        // there is an overlap, we remove the overlap from the duration
        // ensuring that the sum is not negative (ie: fully overlapped events)
        // NOTE: we add the gap since it is a negative number
        processedData.totalDuration += Math.max(currentEntry.duration + currentEntry.gap, 0);
      }

      // remove eventual gaps from the accumulated delay
      // we only affect positive delays (time forwards)
      if (processedData.totalDelay > 0 && currentEntry.gap > 0) {
        let correctedDelay = 0;
        // we need to separate the delay that is accumulated from one that may exist after the gap
        if (isOntimeDelay(processedData.previousEntry)) {
          correctedDelay = processedData.previousEntry.duration;
          processedData.totalDelay -= correctedDelay;
        }
        processedData.totalDelay = Math.max(processedData.totalDelay - currentEntry.gap, 0);
        processedData.totalDelay += correctedDelay;
      }

      // current event delay is the current accumulated delay
      currentEntry.delay = processedData.totalDelay;

      // assign data for next iteration
      processedData.previousEvent = currentEntry;

      // lastEntry is the event with the latest end time
      if (isNewLatest(currentEntry, processedData.latestEvent)) {
        processedData.latestEvent = currentEntry;
        processedData.lastEnd = currentEntry.timeEnd;
      }
    }
  } else if (isOntimeDelay(currentEntry)) {
    // !!! this must happen after handling the links
    processedData.totalDelay += currentEntry.duration;
    currentEntry.parent = childOfBlock;
  }

  if (!childOfBlock) {
    processedData.order.push(currentEntry.id);
  }
  processedData.entries[currentEntry.id] = currentEntry;
  processedData.previousEntry = currentEntry;

  return { processedData, processedEntry: currentEntry };
}
