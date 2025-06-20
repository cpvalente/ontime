import { MILLIS_PER_MINUTE } from 'ontime-utils';

export const timerConfig = {
  skipLimit: 1000, // threshold of skip for recalculating, values lower than updateRate can cause issues with rolling over midnight
  updateRate: 32, // how often do we update the timer
  notificationRate: 1000, // how often do we notify clients and integrations
  triggerAhead: 10, // how far ahead do we trigger the end event
  auxTimerDefault: 5 * MILLIS_PER_MINUTE, // default aux timer duration
};
