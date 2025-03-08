import { OntimeRundown, isOntimeDelay, isOntimeEvent, OntimeEvent } from 'ontime-types';
import { deleteAtIndex } from 'ontime-utils';

/**
 * Applies delay from given event ID, deletes the delay event after
 * @throws {Error} if event ID not found or is not a delay
 */
export function apply(eventId: string, rundown: OntimeRundown): OntimeRundown {
  const delayIndex = rundown.findIndex((event) => event.id === eventId);
  const delayEvent = rundown.at(delayIndex);

  if (!delayEvent) {
    throw new Error('Given event ID not found');
  }

  if (!isOntimeDelay(delayEvent)) {
    throw new Error('Given event ID is not a delay');
  }

  // if the delay is empty, or the last element, we can just delete it
  if (delayEvent.duration === 0 || delayIndex === rundown.length - 1) {
    return deleteAtIndex(delayIndex, rundown);
  }

  /**
   * We apply the delay to the rundown
   * This logic is mostly in sync with rundownCache.generate
   */
  const updatedRundown = structuredClone(rundown);
  let delayValue = delayEvent.duration;
  let lastEntry: OntimeEvent | null = null;
  let isFirstEvent = true;

  for (let i = delayIndex + 1; i < updatedRundown.length; i++) {
    const currentEntry = updatedRundown[i];

    // we don't do operation on other event types
    if (!isOntimeEvent(currentEntry)) {
      continue;
    }

    // we need to remove the link in the first event to maintain the gap
    let shouldUnlink = isFirstEvent;
    isFirstEvent = false;

    // if the event is not linked, we try and maintain gaps
    if (lastEntry !== null) {
      // when applying negative delays, we need to unlink the event
      // if the previous event was fully consumed by the delay
      if (currentEntry.linkStart && delayValue < 0 && lastEntry.timeStart + delayValue < 0) {
        shouldUnlink = true;
      }

      if (currentEntry.gap > 0) {
        delayValue = Math.max(delayValue - currentEntry.gap, 0);
      }

      if (delayValue === 0) {
        // we can bail from continuing if there are no further delays to apply
        break;
      }
    }

    // save the current entry before making mutations on its values
    lastEntry = { ...currentEntry };

    if (shouldUnlink) {
      currentEntry.linkStart = null;
      shouldUnlink = false;
    }

    // event times move up by the delay value
    // we dont update the delay value since we would need to iterate through the entire dataset
    // this is handled by the rundownCache.generate function
    currentEntry.timeStart = Math.max(0, currentEntry.timeStart + delayValue);
    currentEntry.timeEnd = Math.max(currentEntry.duration, currentEntry.timeEnd + delayValue);
    currentEntry.revision += 1;
  }

  return deleteAtIndex(delayIndex, updatedRundown);
}
