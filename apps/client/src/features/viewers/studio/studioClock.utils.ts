import { OntimeEvent } from 'ontime-types';

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
