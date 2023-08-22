import { OntimeEvent, OntimeRundown, SupportedEvent } from 'ontime-types';

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

    if (currentEvent.type === SupportedEvent.Block) {
      break;
    } else if (currentEvent.type === SupportedEvent.Event) {
      const event = currentEvent as OntimeEvent;
      event.timeStart = Math.max(0, event.timeStart + delayValue);
      event.timeEnd = Math.max(event.duration, event.timeEnd + delayValue);
      if (event.delay) {
        event.delay = event.delay - delayValue;
      }
      event.revision += 1;
    }
  }

  return deleteAtIndex(delayIndex, updatedRundown);
}
