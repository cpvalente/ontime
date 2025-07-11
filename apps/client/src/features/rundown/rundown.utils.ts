import {
  EntryId,
  isOntimeBlock,
  isOntimeEvent,
  isPlayableEvent,
  MaybeString,
  OntimeDelay,
  OntimeEntry,
  OntimeEvent,
  OntimeMilestone,
  PlayableEvent,
  RundownEntries,
  SupportedEntry,
} from 'ontime-types';
import { checkIsNextDay, isNewLatest } from 'ontime-utils';

type RundownMetadata = {
  previousEvent: PlayableEvent | null; // The playableEvent from the previous iteration, used by indicators
  latestEvent: PlayableEvent | null; // The playableEvent most forwards in time processed so far
  previousEntryId: MaybeString; // previous entry is used to infer position in the rundown for new events
  thisId: MaybeString;
  eventIndex: number;
  isPast: boolean;
  isNextDay: boolean;
  totalGap: number;
  isLinkedToLoaded: boolean; // check if the event can link all the way back to the currently playing event
  isLoaded: boolean;
  groupId: MaybeString;
  groupColour: string | undefined;
  groupEntries: number | undefined;
};

/**
 * Creates a process function which aggregates the rundown metadata and event metadata
 */
export function makeRundownMetadata(selectedEventId: MaybeString) {
  let rundownMeta: RundownMetadata = {
    previousEvent: null,
    latestEvent: null,
    previousEntryId: null,
    thisId: null,
    eventIndex: 0,
    isPast: Boolean(selectedEventId), // all events before the current selected are in the past
    isNextDay: false,
    totalGap: 0,
    isLinkedToLoaded: false,
    isLoaded: false,
    groupId: null,
    groupColour: undefined,
    groupEntries: undefined,
  };

  function process(entry: OntimeEntry): Readonly<RundownMetadata> {
    const processedRundownMetadata = processEntry(rundownMeta, selectedEventId, entry);
    rundownMeta = processedRundownMetadata;
    return rundownMeta;
  }

  return { metadata: rundownMeta, process };
}

/**
 * Receives a rundown entry and processes its place in the rundown
 */
function processEntry(
  rundownMetadata: RundownMetadata,
  selectedEventId: MaybeString,
  entry: Readonly<OntimeEntry>,
): Readonly<RundownMetadata> {
  const processedData = { ...rundownMetadata };
  // initialise data to be overridden below
  processedData.isNextDay = false;
  processedData.isLoaded = false;

  processedData.previousEntryId = processedData.thisId; // thisId comes from the previous iteration
  processedData.thisId = entry.id; // we reassign thisId
  processedData.previousEvent = processedData.latestEvent;

  if (entry.id === selectedEventId) {
    processedData.isLoaded = true;
    processedData.isPast = false;
  }

  if (isOntimeBlock(entry)) {
    processedData.groupId = entry.id;
    processedData.groupColour = entry.colour;
    processedData.groupEntries = entry.entries.length;
  } else {
    // for delays and blocks, we insert the group metadata
    if ((entry as OntimeEvent | OntimeDelay | OntimeMilestone).parent !== processedData.groupId) {
      // if the parent is not the current group, we need to update the groupId
      processedData.groupId = (entry as OntimeEvent | OntimeDelay | OntimeMilestone).parent;
      processedData.groupEntries = undefined;
      if ((entry as OntimeEvent | OntimeDelay | OntimeMilestone).parent === null) {
        // if the entry has no parent, it cannot have a group colour
        processedData.groupColour = undefined;
      }
    }

    if (isOntimeEvent(entry)) {
      // event indexes are 1 based in UI
      processedData.eventIndex += 1;

      if (isPlayableEvent(entry)) {
        processedData.isNextDay = checkIsNextDay(entry, processedData.previousEvent);
        processedData.totalGap += entry.gap;

        if (!processedData.isPast && !processedData.isLoaded) {
          /**
           * isLinkToLoaded is a chain value that we maintain until we
           * a) find an unlinked event
           * b) find a countToEnd event
           */
          processedData.isLinkedToLoaded = entry.linkStart && !processedData.previousEvent?.countToEnd;
        }

        if (isNewLatest(entry, processedData.latestEvent)) {
          // this event is the forward most event in rundown, for next iteration
          processedData.latestEvent = entry;
        }
      }
    }
  }

  return processedData;
}

/**
 * Creates a sortable list of entries
 * ------------------------------------
 * Due to limitations in dnd-kit we need to flatten the list of entries
 * This list should also be aware of any elements that are sortable (ie: block ends)
 */
export function makeSortableList(order: EntryId[], entries: RundownEntries): EntryId[] {
  const flatIds: EntryId[] = [];

  for (let i = 0; i < order.length; i++) {
    const entry = entries[order[i]];

    if (!entry) {
      continue;
    }

    if (isOntimeBlock(entry)) {
      // inside a block there are delays and events
      // there is no need for special handling
      flatIds.push(entry.id);
      flatIds.push(...entry.entries);

      // close the block
      flatIds.push(`end-${entry.id}`);
    } else {
      flatIds.push(entry.id);
    }
  }
  return flatIds;
}

/**
 * Checks whether a drop operation is valid
 * Currently only used for validating dropping blocks
 */
export function canDrop(targetType?: SupportedEntry, targetParent?: EntryId | null): boolean {
  if (targetType === 'event' || targetType === 'delay') {
    return targetParent === null;
  }
  // remaining events will be block or end-block
  // we can swap places with other blocks
  return targetType == 'block';
}

/**
 * calculates destinations for an entry moving one position up in the rundown
 * @returns An object describing how to move the entry:
 * - destinationId: The target entry ID (null if no movement possible)
 * - order: How to position relative to the destination:
 *   - 'before': Place before the destination
 *   - 'after': Place after the destination
 *   - 'insert': Insert into the destination (for blocks)
 */
export function moveUp(
  entryId: EntryId,
  flatOrder: EntryId[],
  entries: RundownEntries,
): { destinationId: EntryId | null; order: 'before' | 'after' | 'insert' } {
  const currentEntry = entries[entryId];
  const currentIndex = flatOrder.indexOf(entryId);
  const previousEntryId = flatOrder[currentIndex - 1];

  // 1. moving at the top of the list
  if (!previousEntryId) {
    // 1a. we are in a block and need to move outside of it
    if ('parent' in currentEntry && currentEntry.parent !== null) {
      return { destinationId: currentEntry.parent, order: 'before' };
    }
    // 1b. we are at the start of the rundown, no movement possible
    return { destinationId: null, order: 'before' };
  }

  // 2. moving a block (always moves at top level)
  if (isOntimeBlock(currentEntry)) {
    // 21. if previous entry is inside a block, swap with parent
    const previousEntry = entries[previousEntryId];
    if ('parent' in previousEntry && previousEntry.parent !== null) {
      return { destinationId: previousEntry.parent, order: 'before' };
    }

    // 2b. previous entry is at top level, we just swap places
    return { destinationId: previousEntryId, order: 'before' };
  }

  const previousEntry = entries[previousEntryId];
  const currentEntryParent = currentEntry.parent;

  // 3. moving in and out of a block
  if (isOntimeBlock(previousEntry)) {
    // 3a. if we're not already in the block, move into it
    if (currentEntryParent === null) {
      return { destinationId: previousEntryId, order: 'insert' };
    }
    // 3b. otherwise, move before the block
    return { destinationId: previousEntryId, order: 'before' };
  }

  // 4. moving into the same block as previous entry
  if (isOntimeEvent(previousEntry) && previousEntry.parent !== null && currentEntryParent === null) {
    return { destinationId: previousEntryId, order: 'after' };
  }

  // default - swap positions with previous entry
  return { destinationId: previousEntryId, order: 'before' };
}

/**
 * calculates destinations for an entry moving one position down in the rundown
 * @returns An object describing how to move the entry:
 * - destinationId: The target entry ID (null if no movement possible)
 * - order: How to position relative to the destination:
 *   - 'before': Place before the destination
 *   - 'after': Place after the destination
 *   - 'insert': Insert into the destination (for blocks)
 */
export function moveDown(
  entryId: EntryId,
  flatOrder: EntryId[],
  entries: RundownEntries,
): { destinationId: EntryId | null; order: 'before' | 'after' | 'insert' } {
  const currentEntry = entries[entryId];
  const currentIndex = flatOrder.indexOf(entryId);
  const nextEntryId = flatOrder[currentIndex + 1];

  // 1. check if we're the last entry in a block
  if ('parent' in currentEntry && currentEntry.parent !== null) {
    const parentBlock = entries[currentEntry.parent];
    if (isOntimeBlock(parentBlock) && parentBlock.entries[parentBlock.entries.length - 1] === entryId) {
      return { destinationId: currentEntry.parent, order: 'after' };
    }
  }

  // 2. moving at the end of the list
  if (!nextEntryId) {
    return { destinationId: null, order: 'after' };
  }

  // 3. moving a block (always moves at top level)
  if (isOntimeBlock(currentEntry)) {
    // if next entry is inside this block, skip past all children
    if (currentEntry.entries.includes(nextEntryId)) {
      const afterBlockIndex = currentIndex + currentEntry.entries.length + 1;
      const afterBlockId = flatOrder[afterBlockIndex];

      // 2a. block is the last top level entry
      if (!afterBlockId) {
        return { destinationId: null, order: 'after' };
      }
      // 2b. move after the next top level event
      return { destinationId: afterBlockId, order: 'after' };
    }
    // 2c. empty block move after the next entry
    return { destinationId: nextEntryId, order: 'after' };
  }

  const nextEntry = entries[nextEntryId];
  const currentEntryParent = currentEntry.parent;

  // 4. handle moving relative to blocks
  if (isOntimeBlock(nextEntry)) {
    if (currentEntryParent === null) {
      // we are entering a block
      if (nextEntry.entries.length === 0) {
        // 3a. if the block is empty, insert into it
        return { destinationId: nextEntryId, order: 'insert' };
      }
      // 3b. otherwise, add before the first entry in the block
      const firstBlockEntryId = nextEntry.entries[0];
      return { destinationId: firstBlockEntryId, order: 'before' };
    }
  }

  // 5. handle moving between block and top level
  const nextEntryParent = isOntimeEvent(nextEntry) ? nextEntry.parent : null;
  if (nextEntryParent !== null && currentEntryParent === null) {
    return { destinationId: nextEntryId, order: 'after' };
  }

  // default - swap positions with next entry
  return { destinationId: nextEntryId, order: 'after' };
}

/**
 * Reorders unorderedArray to match the flatOrder entries
 * Useful for operations that convert selections (out of order) to rundown
 */
export function orderEntries(unorderedArray: EntryId[], flatOrder: EntryId[]): EntryId[] {
  const orderedArray: EntryId[] = [];
  for (const id of flatOrder) {
    if (unorderedArray.includes(id)) {
      orderedArray.push(id);
    }
  }
  return orderedArray;
}
