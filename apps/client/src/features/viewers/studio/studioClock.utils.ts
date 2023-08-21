import { OntimeEvent } from 'ontime-types';

import { formatTime } from '../../../common/utils/time';

export type ScheduleEvent = {
  id: string;
  time: string;
  title: string;
  isNow: boolean;
  isNext: boolean;
  colour: string;
};

/**
 * @description Returns trimmed event list array
 * @param {Object[]} rundown - given rundown
 * @param {string} selectedId - id of currently selected event
 * @param {number} limit - max number of events to return
 * @returns {Object[]} Event list with maximum <limit> objects
 */
export const trimRundown = (rundown: OntimeEvent[], selectedId: string, limit: number): OntimeEvent[] => {
  if (rundown == null) return [];

  const BEFORE = 2;
  const trimmedRundown = [...rundown];

  // limit events length if necessary
  if (limit != null) {
    while (trimmedRundown.length > limit) {
      const idx = trimmedRundown.findIndex((e) => e.id === selectedId);
      if (idx <= BEFORE) {
        trimmedRundown.pop();
      } else {
        trimmedRundown.shift();
      }
    }
  }
  return trimmedRundown;
};

type FormatEventListOptionsProp = {
  showEnd?: boolean;
};
/**
 * @description Returns list of events formatted to be displayed
 * @param {Object[]} rundown - given rundown
 * @param {string} selectedId - id of currently selected event
 * @param {string} nextId - id of next event
 * @param {object} [options]
 * @param {boolean} [options.showEnd] - whether to show the end time
 * @returns {Object[]} Formatted list of events [{time: -, title: -, isNow, isNext}]
 */
export const formatEventList = (
  rundown: OntimeEvent[],
  selectedId: string,
  nextId: string,
  options: FormatEventListOptionsProp,
): ScheduleEvent[] => {
  if (rundown == null) return [];
  const { showEnd = false } = options;

  // format list
  return rundown.map((event) => {
    const start = formatTime(event.timeStart + (event.delay || 0));
    const end = formatTime(event.timeEnd + (event.delay || 0));

    return {
      id: event.id,
      time: showEnd ? `${start} - ${end}` : start,
      title: event.title,
      isNow: event.id === selectedId,
      isNext: event.id === nextId,
      colour: event.colour,
    };
  });
};
