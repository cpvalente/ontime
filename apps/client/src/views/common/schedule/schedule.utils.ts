import { OntimeEvent } from 'ontime-types';

/**
 * Gather rules for how to present scheduled times
 */
export function getScheduledTimes(event: OntimeEvent) {
  return {
    timeStart: event.timeStart,
    timeEnd: event.timeEnd,
    delay: event.skip ? 0 : event.delay,
  };
}
