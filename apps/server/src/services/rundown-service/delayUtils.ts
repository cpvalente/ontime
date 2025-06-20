import { Rundown, EntryId, isOntimeDelay, isOntimeEvent, OntimeEvent } from 'ontime-types';
import { deleteAtIndex } from 'ontime-utils';

/**
 * Applies delay from given event ID, deletes the delay event after
 * Mutates the given rundown
 * @throws if event ID not found or is not a delay
 */
export function apply(delayId: EntryId, rundown: Rundown): Rundown {
  const delayEvent = rundown.entries[delayId];

  if (!delayEvent || !isOntimeDelay(delayEvent)) {
    throw new Error('Given delay ID not found');
  }

  const delayIndex = rundown.order.findIndex((entryId) => entryId === delayId);

  // if the delay is empty, or the last element
  // we can just delete it with no further operations
  if (delayEvent.duration === 0 || delayIndex === rundown.order.length - 1) {
    delete rundown.entries[delayId];
    rundown.order = deleteAtIndex(delayIndex, rundown.order);
    return rundown;
  }

  /**
   * We apply the delay to the rundown
   * This logic is mostly in sync with rundownCache.generate
   * The difference is that here it will become part of the schedule,
   * so we cant leave the work for the generate function
   */
  let delayValue = delayEvent.duration;
  let lastEntry: OntimeEvent | null = null;
  let isFirstEvent = true;

  for (let i = delayIndex + 1; i < rundown.order.length; i++) {
    const currentId = rundown.order[i];
    const currentEntry = rundown.entries[currentId];

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
      currentEntry.linkStart = false;
      shouldUnlink = false;
    }

    // event times move up by the delay value
    // we dont update the delay value since we would need to iterate through the entire dataset
    // this is handled by the rundownCache.generate function
    currentEntry.timeStart = Math.max(0, currentEntry.timeStart + delayValue);
    currentEntry.timeEnd = Math.max(currentEntry.duration, currentEntry.timeEnd + delayValue);
    currentEntry.revision += 1;
  }

  delete rundown.entries[delayId];
  rundown.order = deleteAtIndex(delayIndex, rundown.order);
  rundown.revision += 1;

  return rundown;
}
