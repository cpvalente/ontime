import { isOntimeEvent, isPlayableEvent, MaybeString, OntimeEntry, PlayableEvent } from 'ontime-types';
import { checkIsNextDay, isNewLatest } from 'ontime-utils';

type RundownMetadata = {
  previousEvent: PlayableEvent | null; // The playableEvent from the previous iteration, used by indicators
  latestEvent: PlayableEvent | null; // The playableEvent most forwards in time processed so far
  previousEntryId: MaybeString; // previous entry is used to infer position in the rundown for new events
  thisId: MaybeString;
  eventIndex: number;
  isPast: boolean;
  isNext: boolean;
  isNextDay: boolean;
  totalGap: number;
  isLinkedToLoaded: boolean; // check if the event can link all the way back to the currently playing event
  isLoaded: boolean;
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
    isNext: false,
    isNextDay: false,
    totalGap: 0,
    isLinkedToLoaded: false,
    isLoaded: false,
  };

  function process(entry: OntimeEntry): Readonly<RundownMetadata> {
    const processedRundownMetadata = processEntry(rundownMeta, selectedEventId, entry);
    rundownMeta = processedRundownMetadata;
    return rundownMeta;
  }

  return process;
}

/**
 * Receives a rundown entry and processes its place in the rundown
 *
 */
function processEntry(
  rundownMetadata: RundownMetadata,
  selectedEventId: MaybeString,
  entry: Readonly<OntimeEntry>,
): Readonly<RundownMetadata> {
  const processedData = { ...rundownMetadata };
  processedData.isNextDay = false;
  processedData.isLoaded = false;
  processedData.previousEntryId = processedData.thisId;
  processedData.thisId = entry.id;
  processedData.previousEvent = processedData.latestEvent;

  if (entry.id === selectedEventId) {
    processedData.isLoaded = true;
    processedData.isPast = false;
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

      if (isNewLatest(entry, processedData.previousEvent)) {
        // this event is the forward most event in rundown, for next iteration
        processedData.latestEvent = entry;
      }
    }
  }

  return processedData;
}
