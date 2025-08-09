import {
  EntryId,
  isOntimeEvent,
  isOntimeGroup,
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

  if (isOntimeGroup(entry)) {
    processedData.groupId = entry.id;
    processedData.groupColour = entry.colour;
    processedData.groupEntries = entry.entries.length;
  } else {
    // for delays and groups, we insert the group metadata
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
 * This list should also be aware of any elements that are sortable (ie: group ends)
 */
export function makeSortableList(order: EntryId[], entries: RundownEntries): EntryId[] {
  const flatIds: EntryId[] = [];

  for (let i = 0; i < order.length; i++) {
    const entry = entries[order[i]];

    if (!entry) {
      continue;
    }

    if (isOntimeGroup(entry)) {
      // inside a group there are delays and events
      // there is no need for special handling
      flatIds.push(entry.id);
      flatIds.push(...entry.entries);

      // close the group
      flatIds.push(`end-${entry.id}`);
    } else {
      flatIds.push(entry.id);
    }
  }
  return flatIds;
}

/**
 * Checks whether a drop operation is valid
 * Currently only used for validating dropping groups
 */
export function canDrop(targetType?: SupportedEntry | 'end-group', targetParent?: EntryId | null): boolean {
  // this would mean inserting a group inside another
  if (targetType === 'end-group') {
    return false;
  }

  // this means swapping places with another group
  if (targetType === 'group') {
    return true;
  }

  // for all other cases, we just need to check if we are inside a group
  return targetParent === null;
}

/**
 * calculates destinations for an entry moving one position up in the rundown
 * @returns An object describing how to move the entry:
 * - destinationId: The target entry ID (null if no movement possible)
 * - order: How to position relative to the destination:
 *   - 'before': Place before the destination
 *   - 'after': Place after the destination
 *   - 'insert': Insert into the destination (for groups)
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
    // 1a. we are in a group and need to move outside of it
    if ('parent' in currentEntry && currentEntry.parent !== null) {
      return { destinationId: currentEntry.parent, order: 'before' };
    }
    // 1b. we are at the start of the rundown, no movement possible
    return { destinationId: null, order: 'before' };
  }

  // 2. moving a group (always moves at top level)
  if (isOntimeGroup(currentEntry)) {
    // 21. if previous entry is inside a group, swap with parent
    const previousEntry = entries[previousEntryId];
    if ('parent' in previousEntry && previousEntry.parent !== null) {
      return { destinationId: previousEntry.parent, order: 'before' };
    }

    // 2b. previous entry is at top level, we just swap places
    return { destinationId: previousEntryId, order: 'before' };
  }

  const previousEntry = entries[previousEntryId];
  const currentEntryParent = currentEntry.parent;

  // 3. moving in and out of a group
  if (isOntimeGroup(previousEntry)) {
    // 3a. if we're not already in the group, move into it
    if (currentEntryParent === null) {
      return { destinationId: previousEntryId, order: 'insert' };
    }
    // 3b. otherwise, move before the group
    return { destinationId: previousEntryId, order: 'before' };
  }

  // 4. moving into the same group as previous entry
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
 *   - 'insert': Insert into the destination (for groups)
 */
export function moveDown(
  entryId: EntryId,
  flatOrder: EntryId[],
  entries: RundownEntries,
): { destinationId: EntryId | null; order: 'before' | 'after' | 'insert' } {
  const currentEntry = entries[entryId];
  const currentIndex = flatOrder.indexOf(entryId);
  const nextEntryId = flatOrder[currentIndex + 1];

  // 1. check if we're the last entry in a group
  if ('parent' in currentEntry && currentEntry.parent !== null) {
    const parentGroup = entries[currentEntry.parent];
    if (isOntimeGroup(parentGroup) && parentGroup.entries[parentGroup.entries.length - 1] === entryId) {
      return { destinationId: currentEntry.parent, order: 'after' };
    }
  }

  // 2. moving at the end of the list
  if (!nextEntryId) {
    return { destinationId: null, order: 'after' };
  }

  // 3. moving a group (always moves at top level)
  if (isOntimeGroup(currentEntry)) {
    // if next entry is inside this group, skip past all children
    if (currentEntry.entries.includes(nextEntryId)) {
      const afterGroupIndex = currentIndex + currentEntry.entries.length + 1;
      const afterGroupId = flatOrder[afterGroupIndex];

      // 2a. group is the last top level entry
      if (!afterGroupId) {
        return { destinationId: null, order: 'after' };
      }
      // 2b. move after the next top level event
      return { destinationId: afterGroupId, order: 'after' };
    }
    // 2c. empty group move after the next entry
    return { destinationId: nextEntryId, order: 'after' };
  }

  const nextEntry = entries[nextEntryId];
  const currentEntryParent = currentEntry.parent;

  // 4. handle moving relative to groups
  if (isOntimeGroup(nextEntry)) {
    if (currentEntryParent === null) {
      // we are entering a group
      if (nextEntry.entries.length === 0) {
        // 3a. if the group is empty, insert into it
        return { destinationId: nextEntryId, order: 'insert' };
      }
      // 3b. otherwise, add before the first entry in the group
      const firstGroupEntryId = nextEntry.entries[0];
      return { destinationId: firstGroupEntryId, order: 'before' };
    }
  }

  // 5. handle moving between group and top level
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
