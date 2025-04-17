import {
  OntimeEvent,
  CustomFieldLabel,
  CustomFields,
  OntimeEntry,
  OntimeBaseEvent,
  EntryId,
  isOntimeEvent,
  isPlayableEvent,
  isOntimeDelay,
  PlayableEvent,
  RundownEntries,
} from 'ontime-types';
import { dayInMs, getLinkedTimes, getTimeFrom, isNewLatest } from 'ontime-utils';

import type { RundownMetadata } from './rundown.types.js';

/**
 * Utility function to add an entry, mutates given assignedCustomFields in place
 * @param label
 * @param eventId
 */
export function addToCustomAssignment(
  label: CustomFieldLabel,
  eventId: string,
  assignedCustomFields: Record<string, string[]>,
) {
  if (!Array.isArray(assignedCustomFields[label])) {
    assignedCustomFields[label] = [];
  }
  assignedCustomFields[label].push(eventId);
}

/**
 * Sanitises custom fields and updates values if necessary
 * Mutates in place mutableEvent and assignedCustomFields
 */
export function handleCustomField(
  customFields: CustomFields,
  customFieldChangelog: Record<string, string>,
  mutableEvent: OntimeEvent,
  assignedCustomFields: Record<string, string[]>,
) {
  for (const field in mutableEvent.custom) {
    // rename the property if it is in the changelog
    if (field in customFieldChangelog) {
      const oldData = mutableEvent.custom[field];
      const newLabel = customFieldChangelog[field];

      mutableEvent.custom[newLabel] = oldData;
      delete mutableEvent.custom[field];
      addToCustomAssignment(newLabel, mutableEvent.id, assignedCustomFields);
      continue;
    }

    if (field in customFields) {
      // add field to assignment map
      addToCustomAssignment(field, mutableEvent.id, assignedCustomFields);
    } else {
      // delete data if it is not declared in project level custom fields
      delete mutableEvent.custom[field];
    }
  }
}

/** List of event properties which do not need the rundown to be regenerated */
enum RegenerateWhitelist {
  'id',
  'cue',
  'title',
  'note',
  'endAction',
  'timerType',
  'countToEnd',
  'isPublic',
  'colour',
  'timeWarning',
  'timeDanger',
  'custom',
}

/**
 * given a patch, returns whether all keys are whitelisted
 */
export function isDataStale(patch: Partial<OntimeEntry>): boolean {
  return Object.keys(patch).some(willCauseRegeneration);
}

/**
 * given a key, returns whether it is whitelisted
 */
export function willCauseRegeneration(key: string): boolean {
  return !(key in RegenerateWhitelist);
}

/**
 * Given an event and a patch to that event checks whether there are actual changes to the dataset
 * @param existingEvent
 * @param newEvent
 * @returns
 */
export function hasChanges<T extends OntimeBaseEvent>(existingEvent: T, newEvent: Partial<T>): boolean {
  return Object.keys(newEvent).some(
    (key) => !Object.hasOwn(existingEvent, key) || existingEvent[key as keyof T] !== newEvent[key as keyof T],
  );
}

/**
 * Utility for calculating if the current events should have a day offset
 * @param current the current event under test
 * @param previous the previous event
 * @returns 0 or 1 for easy accumulation with the total days
 */
export function calculateDayOffset(
  current: Pick<OntimeEvent, 'timeStart'>,
  previous: Pick<OntimeEvent, 'timeStart' | 'duration'> | null,
) {
  // if there is no previous there can't be a day offset
  if (!previous) {
    return 0;
  }

  // if the previous events duration is zero it will push the current event to next day
  if (previous.duration === 0) {
    return 0;
  }

  // if the previous event crossed midnight then the current event is in the next day
  if (previous.timeStart + previous.duration >= dayInMs) {
    return 1;
  }

  // if the current events starts at the same time or before the previous event then it is the next day
  if (current.timeStart <= previous.timeStart) {
    return 1;
  }

  return 0;
}

export type ProcessedRundownMetadata = RundownMetadata & {
  entries: RundownEntries;
  order: EntryId[];
  previousEvent: PlayableEvent | null; // The playableEvent from the previous iteration
  latestEvent: PlayableEvent | null; // The playableEvent most forwards in time processed so far
  previousEntry: OntimeEntry | null; // The entry processed in the previous iteration
};

export function makeRundownMetadata(customFields: CustomFields, customFieldChangelog: Record<string, string>) {
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
    const data = processEntry(rundownMeta, customFields, customFieldChangelog, entry, childOfBlock);
    rundownMeta = data.processedData;
    return data;
  }

  function getMetadata(): ProcessedRundownMetadata {
    return rundownMeta;
  }

  return { process, getMetadata };
}

function processEntry<T extends OntimeEntry>(
  rundownMetadata: ProcessedRundownMetadata,
  customFields: CustomFields,
  customFieldChangelog: Record<string, string>,
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
    handleCustomField(customFields, customFieldChangelog, currentEntry, processedData.assignedCustomFields);

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
  }

  if (!childOfBlock) {
    processedData.order.push(currentEntry.id);
  }
  processedData.entries[currentEntry.id] = currentEntry;
  processedData.previousEntry = currentEntry;

  return { processedData, processedEntry: currentEntry };
}
