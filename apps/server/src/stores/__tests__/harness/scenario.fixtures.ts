import { Rundown } from 'ontime-types';
import { MILLIS_PER_HOUR, MILLIS_PER_MINUTE } from 'ontime-utils';

import {
  makeOntimeDelay,
  makeOntimeEvent,
  makeOntimeGroup,
  makeRundown,
} from '../../../api-data/rundown/__mocks__/rundown.mocks.js';

const h = MILLIS_PER_HOUR;
const m = MILLIS_PER_MINUTE;

export const time = { h, m };

/**
 * Flat rundown exercising gaps, linked events and flags
 * - flat1: 10:00 - 10:10
 * - flat2: 10:10 - 10:20 (linked to flat1, flagged)
 * - flat3: 10:30 - 10:40 (10min gap, flagged)
 * - flat4: 10:50 - 11:00 (10min gap)
 *
 * total gap from flat1: 20min, planned 10:00 - 11:00
 */
export function makeFlatRundown(): Rundown {
  return makeRundown({
    entries: {
      flat1: makeOntimeEvent({
        id: 'flat1',
        timeStart: 10 * h,
        timeEnd: 10 * h + 10 * m,
        duration: 10 * m,
        timeWarning: 2 * m,
        timeDanger: 1 * m,
        parent: null,
      }),
      flat2: makeOntimeEvent({
        id: 'flat2',
        timeStart: 10 * h + 10 * m,
        timeEnd: 10 * h + 20 * m,
        duration: 10 * m,
        linkStart: true,
        flag: true,
        parent: null,
      }),
      flat3: makeOntimeEvent({
        id: 'flat3',
        timeStart: 10 * h + 30 * m,
        timeEnd: 10 * h + 40 * m,
        duration: 10 * m,
        flag: true,
        parent: null,
      }),
      flat4: makeOntimeEvent({
        id: 'flat4',
        timeStart: 10 * h + 50 * m,
        timeEnd: 11 * h,
        duration: 10 * m,
        parent: null,
      }),
    },
    order: ['flat1', 'flat2', 'flat3', 'flat4'],
  });
}

/**
 * Rundown with a group and a trailing event
 * - group: [grouped1: 10:00 - 10:30, grouped2: 10:30 - 11:00]
 * - after: 11:30 - 12:00 (30min gap)
 */
export function makeGroupedRundown(): Rundown {
  return makeRundown({
    entries: {
      group: makeOntimeGroup({ id: 'group', entries: ['grouped1', 'grouped2'] }),
      grouped1: makeOntimeEvent({
        id: 'grouped1',
        timeStart: 10 * h,
        timeEnd: 10 * h + 30 * m,
        duration: 30 * m,
        parent: 'group',
      }),
      grouped2: makeOntimeEvent({
        id: 'grouped2',
        timeStart: 10 * h + 30 * m,
        timeEnd: 11 * h,
        duration: 30 * m,
        parent: 'group',
      }),
      after: makeOntimeEvent({
        id: 'after',
        timeStart: 11 * h + 30 * m,
        timeEnd: 12 * h,
        duration: 30 * m,
        parent: null,
      }),
    },
    order: ['group', 'after'],
  });
}

/**
 * Overnight rundown
 * - night1: 22:00 - 23:30
 * - night2: 23:30 - 00:30 (crosses midnight)
 * - night3: 00:30 - 01:00 (next day)
 */
export function makeOvernightRundown(): Rundown {
  return makeRundown({
    entries: {
      night1: makeOntimeEvent({
        id: 'night1',
        timeStart: 22 * h,
        timeEnd: 23 * h + 30 * m,
        duration: 90 * m,
        parent: null,
      }),
      night2: makeOntimeEvent({
        id: 'night2',
        timeStart: 23 * h + 30 * m,
        timeEnd: 30 * m,
        duration: 60 * m,
        parent: null,
      }),
      night3: makeOntimeEvent({
        id: 'night3',
        timeStart: 30 * m,
        timeEnd: 1 * h,
        duration: 30 * m,
        parent: null,
      }),
    },
    order: ['night1', 'night2', 'night3'],
  });
}

/**
 * Rundown with a count-to-end event
 * - lead: 10:00 - 10:30
 * - toEnd: 10:30 - 11:00 (countToEnd)
 */
export function makeCountToEndRundown(): Rundown {
  return makeRundown({
    entries: {
      lead: makeOntimeEvent({
        id: 'lead',
        timeStart: 10 * h,
        timeEnd: 10 * h + 30 * m,
        duration: 30 * m,
        parent: null,
      }),
      toEnd: makeOntimeEvent({
        id: 'toEnd',
        timeStart: 10 * h + 30 * m,
        timeEnd: 11 * h,
        duration: 30 * m,
        countToEnd: true,
        parent: null,
      }),
    },
    order: ['lead', 'toEnd'],
  });
}

/**
 * Rundown with a delay entry
 * - delayed1: 10:00 - 10:10
 * - (delay 5min)
 * - delayed2: 10:20 - 10:30 (10min gap)
 */
export function makeDelayedRundown(): Rundown {
  return makeRundown({
    entries: {
      delayed1: makeOntimeEvent({
        id: 'delayed1',
        timeStart: 10 * h,
        timeEnd: 10 * h + 10 * m,
        duration: 10 * m,
        parent: null,
      }),
      delay: makeOntimeDelay({ id: 'delay', duration: 5 * m, parent: null }),
      delayed2: makeOntimeEvent({
        id: 'delayed2',
        timeStart: 10 * h + 20 * m,
        timeEnd: 10 * h + 30 * m,
        duration: 10 * m,
        parent: null,
      }),
    },
    order: ['delayed1', 'delay', 'delayed2'],
  });
}
