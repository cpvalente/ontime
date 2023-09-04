import { isOntimeBlock, isOntimeEvent, OntimeRundown, SupportedEvent } from 'ontime-types';

import { deleteAtIndex } from '../utils/arrayUtils.js';

export function _applyDelay(eventId: string, rundown: OntimeRundown): OntimeRundown {
  const delayIndex = rundown.findIndex((event) => event.id === eventId);
  const delayEvent = rundown.at(delayIndex);

  if (delayEvent.type !== SupportedEvent.Delay) {
    throw new Error('Given event ID is not a delay');
  }

  const updatedRundown = [...rundown];
  const delayValue = delayEvent.duration;

  if (delayValue === 0 || delayIndex === rundown.length - 1) {
    // nothing to apply
    return updatedRundown;
  }

  for (let i = delayIndex + 1; i < rundown.length; i++) {
    const currentEvent = updatedRundown[i];

    if (isOntimeBlock(currentEvent)) {
      break;
    } else if (isOntimeEvent(currentEvent)) {
      currentEvent.timeStart = Math.max(0, currentEvent.timeStart + delayValue);
      currentEvent.timeEnd = Math.max(currentEvent.duration, currentEvent.timeEnd + delayValue);
      if (currentEvent.delay) {
        currentEvent.delay = currentEvent.delay - delayValue;
      }
      currentEvent.revision += 1;
    }
  }

  return deleteAtIndex(delayIndex, updatedRundown);
}
