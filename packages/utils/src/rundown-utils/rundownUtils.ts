import { OntimeEvent, OntimeRundown } from 'ontime-types';

import { dayInMs } from '../timeConstants.js';

/**
 * @description calculates event duration considering midnight
 * @param {number} timeStart
 * @param {number} timeEnd
 * @returns {number}
 */
export const calculateDuration = (timeStart: number, timeEnd: number): number => {
  // Durations must be positive
  if (timeEnd < timeStart) {
    return timeEnd + dayInMs - timeStart;
  }
  return timeEnd - timeStart;
};

/**
 * @description swaps two OntimeEvents in the rundown
 * @param {OntimeRundown} rundown
 * @param {number} fromEventIndex
 * @param {number} toEventIndex
 * @returns {OntimeRundown}
 */
export const swapOntimeEvents = (
  rundown: OntimeRundown,
  fromEventIndex: number,
  toEventIndex: number,
): OntimeRundown => {
  const updatedRundown = [...rundown];

  if (fromEventIndex < 0 || toEventIndex < 0) {
    throw new Error('ID not found at index');
  }

  const fromEvent = updatedRundown.at(fromEventIndex) as OntimeEvent;
  const toEvent = updatedRundown.at(toEventIndex) as OntimeEvent;

  updatedRundown[fromEventIndex] = {
    ...toEvent,
    timeStart: fromEvent.timeStart,
    timeEnd: fromEvent.timeEnd,
    duration: fromEvent.duration,
    delay: fromEvent.delay,
  };

  updatedRundown[toEventIndex] = {
    ...fromEvent,
    timeStart: toEvent.timeStart,
    timeEnd: toEvent.timeEnd,
    duration: toEvent.duration,
    delay: toEvent.delay,
  };

  return updatedRundown;
};
