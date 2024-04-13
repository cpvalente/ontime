import { MaybeNumber, OntimeEvent } from 'ontime-types';
import { MILLIS_PER_MINUTE, MILLIS_PER_SECOND } from 'ontime-utils';

/**
 * @description Returns trimmed event list array
 * @param {Object[]} rundown - given rundown
 * @param {string | null} selectedId - id of currently selected event
 * @param {number} limit - max number of events to return
 * @returns {Object[]} Event list with maximum <limit> objects
 */
export function trimRundown(rundown: OntimeEvent[], selectedId: string | null, limit: number): OntimeEvent[] {
  if (rundown.length < 1) return [];
  const startIndex = selectedId
    ? Math.max(
        rundown.findIndex((event) => event.id === selectedId),
        0,
      )
    : 0;
  const endIndex = Math.min(startIndex + limit, rundown.length);
  const trimmedRundown = rundown.slice(startIndex, endIndex);
  return trimmedRundown;
}

/**
 * @description Returns amount of seconds in a date given in milliseconds. For studio clock second indicator
 * @param {MaybeNumber} millis time to format
 * @returns amount of elapsed seconds
 */
export function secondsInMillis(millis: MaybeNumber): number {
  if (!millis) {
    return 0;
  }
  return Math.floor((millis % MILLIS_PER_MINUTE) / MILLIS_PER_SECOND);
}
