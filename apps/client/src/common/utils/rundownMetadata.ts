import {
  MaybeString,
  OntimeDelay,
  OntimeEntry,
  OntimeEvent,
  OntimeMilestone,
  PlayableEvent,
  Rundown,
  isOntimeEvent,
  isOntimeGroup,
  isPlayableEvent,
} from 'ontime-types';
import { checkIsNextDay, isNewLatest } from 'ontime-utils';

export type RundownMetadata = {
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
  isFirstAfterGroup: boolean;
};

export type ExtendedEntry<T extends OntimeEntry = OntimeEntry> = T & RundownMetadata;

export const lastMetadataKey = 'LAST';

export type RundownMetadataObject = Record<string, Readonly<RundownMetadata>>;

/**
 * Generates a Rundown Metadata object from a rundown
 */
export function getRundownMetadata(
  data: Pick<Rundown, 'entries' | 'flatOrder'>,
  selectedEventId: MaybeString,
): RundownMetadataObject {
  const { metadata, process } = initRundownMetadata(selectedEventId);
  // keep a single reference to the metadata which we override for every entry
  let lastSnapshot = metadata;
  const rundownMetadata: RundownMetadataObject = {};

  for (const id of data.flatOrder) {
    const entry = data.entries[id];
    lastSnapshot = process(entry);
    rundownMetadata[id] = lastSnapshot;
  }

  // ensure some blank data even for empty rundowns
  rundownMetadata[lastMetadataKey] = lastSnapshot;

  return rundownMetadata;
}

export function getFlatRundownMetadata(
  data: Pick<Rundown, 'entries' | 'flatOrder'>,
  selectedEventId: MaybeString,
): ExtendedEntry[] {
  const { process } = initRundownMetadata(selectedEventId);
  const flatRundown: ExtendedEntry[] = [];

  for (const id of data.flatOrder) {
    const entry = data.entries[id];
    const extendedEntry = { ...entry, ...process(entry) };
    flatRundown.push(extendedEntry);
  }

  return flatRundown;
}

/**
 * Creates a process function which aggregates the rundown metadata and event metadata
 */
export function initRundownMetadata(selectedEventId: MaybeString) {
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
    isFirstAfterGroup: false,
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
    processedData.isLinkedToLoaded = true;
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
      processedData.isFirstAfterGroup = Boolean(processedData.previousEvent?.parent) && entry.parent === null;

      if (isPlayableEvent(entry)) {
        processedData.isNextDay = checkIsNextDay(entry, processedData.previousEvent);

        if (!processedData.isPast && !processedData.isLoaded) {
          /**
           * isLinkToLoaded is a chain value that we maintain until we
           * a) find an unlinked event
           * b) find a countToEnd event
           */
          processedData.totalGap += entry.gap;
          processedData.isLinkedToLoaded =
            entry.linkStart && !processedData.previousEvent?.countToEnd && processedData.isLinkedToLoaded;
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
