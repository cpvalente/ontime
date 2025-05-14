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
export function makeSortableList(flatOrder: EntryId[], entries: RundownEntries): EntryId[] {
  const entryIds: EntryId[] = [];
  let lastSeenBlock: MaybeString = null;

  for (let i = 0; i < flatOrder.length; i++) {
    const entry = entries[flatOrder[i]];

    if (!entry) {
      continue;
    }

    if (isOntimeBlock(entry)) {
      // close any previous blocks
      if (lastSeenBlock !== null) {
        entryIds.push(`end-${lastSeenBlock}`);
      }
      lastSeenBlock = entry.id;
    }

    if (isOntimeEvent(entry)) {
      // Close the previous block if the parent changes
      if (lastSeenBlock !== null && entry.parent !== lastSeenBlock) {
        entryIds.push(`end-${lastSeenBlock}`);
      }
      lastSeenBlock = entry.parent;
    }

    entryIds.push(entry.id);
  }

  // double check that we close any dangling blocks
  // - if the last element is a block
  // - if a rundown only has a top level block
  if (lastSeenBlock !== null) {
    entryIds.push(`end-${lastSeenBlock}`);
  }

  return entryIds;
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
