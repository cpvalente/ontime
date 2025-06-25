import {
  EntryId,
  isOntimeBlock,
  isOntimeEvent,
  isPlayableEvent,
  MaybeString,
  OntimeDelay,
  OntimeEntry,
  OntimeEvent,
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
  } else {
    // for delays and blocks, we insert the group metadata
    if ((entry as OntimeEvent | OntimeDelay).parent !== processedData.groupId) {
      // if the parent is not the current group, we need to update the groupId
      processedData.groupId = (entry as OntimeEvent | OntimeDelay).parent;
      if ((entry as OntimeEvent | OntimeDelay).parent === null) {
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
 * Calculates destinations for an entry moving one position up in the rundown
 * - Handles noops
 * - Handles moving in and out of blocks
 * TODO: handle moving blocks
 */
export function moveUp(entryId: EntryId, sortableData: EntryId[], entries: RundownEntries) {
  const previousEntryId = getPreviousId(entryId, sortableData);

  // the user is moving up at the top of the list
  if (!previousEntryId) {
    return { destinationId: null, order: 'before', isBlock: false };
  }

  if (previousEntryId.startsWith('end-')) {
    const entry = entries[entryId];
    if (isOntimeBlock(entry)) {
      // if we are moving a block, we cannot insert it
      return { destinationId: previousEntryId.replace('end-', ''), order: 'before', isBlock: false };
    }
    // insert in the block ID will add to the end of the block events
    return { destinationId: previousEntryId.replace('end-', ''), order: 'insert', isBlock: true };
  }

  // @ts-expect-error -- we safeguard the entry not having a parent property
  return { destinationId: previousEntryId, order: 'before', isBlock: Boolean(entries[previousEntryId]?.parent) };
}

/**
 * Calculates destinations for an entry moving one position down in the rundown
 * - Handles noops
 * - Handles moving in and out of blocks
 * TODO: handle moving blocks
 */
export function moveDown(entryId: EntryId, sortableData: EntryId[], entries: RundownEntries) {
  const nextEntryId = getNextId(entryId, sortableData);

  // the user is moving down at the end of the list
  if (!nextEntryId) {
    return { destinationId: null, order: 'after', isBlock: false };
  }

  if (nextEntryId.startsWith('end-')) {
    // move outside the block
    return { destinationId: nextEntryId.replace('end-', ''), order: 'after', isBlock: false };
  }

  /**
   * If the next entry is a block
   * - 1. blocks need to skip over it
   * - 2. if the block has children, we insert before the first child
   * - 3. if the block is empty, we insert into the block
   */
  if (isOntimeBlock(entries[nextEntryId])) {
    const entry = entries[entryId];

    if (isOntimeBlock(entry)) {
      // 1. if we are moving a block, we cannot insert it
      return { destinationId: nextEntryId, order: 'after', isBlock: false };
    }

    const firstBlockChild = entries[nextEntryId].entries.at(0);
    if (firstBlockChild) {
      // 2. add before the first child of the block
      return { destinationId: firstBlockChild, order: 'before', isBlock: true };
    } else {
      // 3. or insert into an empty block
      return { destinationId: nextEntryId, order: 'insert', isBlock: true };
    }
  }

  return { destinationId: nextEntryId, order: 'after', isBlock: Boolean(entries[nextEntryId]?.parent) };
}

/**
 * Utility function gets the ID if the next entry in the list
 * returns null if none is found
 */
function getNextId(entryId: EntryId, sortableData: EntryId[]): EntryId | null {
  const currentIndex = sortableData.indexOf(entryId);
  if (currentIndex === -1 || currentIndex === sortableData.length - 1) {
    // No next ID if not found or at the end
    return null;
  }
  return sortableData[currentIndex + 1];
}

/**
 * Utility function gets the ID if the previous entry in the list
 * returns null if none is found
 */
function getPreviousId(entryId: EntryId, sortableData: EntryId[]): EntryId | null {
  const currentIndex = sortableData.indexOf(entryId);
  if (currentIndex < 1) {
    // No previous ID found or at the beginning
    return null;
  }
  return sortableData[currentIndex - 1];
}
