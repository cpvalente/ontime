import { millisToSeconds } from 'ontime-utils';
import { MaybeNumber } from 'ontime-types';

import { timerConfig } from '../../setup/config.js';

/**
 * Checks whether we should update the clock value
 * - clock has slid
 * - we have rolled into a new seconds unit
 */
export function getShouldClockUpdate(previousUpdate: number, now: number): boolean {
  const shouldForceUpdate = getForceUpdate(previousUpdate, now);
  if (shouldForceUpdate) {
    return true;
  }
  const isClockSecondAhead = millisToSeconds(now) !== millisToSeconds(previousUpdate + timerConfig.triggerAhead);
  return isClockSecondAhead;
}

/**
 * Checks whether we should update the timer value
 * - we have rolled into a new seconds unit
 */
export function getShouldTimerUpdate(previousValue: MaybeNumber, currentValue: MaybeNumber): boolean {
  if (currentValue === null) {
    return false;
  }
  // we avoid trigger ahead since it can cause duplicate triggers
  const shouldUpdateTimer = millisToSeconds(currentValue) !== millisToSeconds(previousValue);
  return shouldUpdateTimer;
}

/**
 * In some cases we want to force an update to the timer
 * - if the clock has slid back
 * - if we have escaped the update rate (clock slid forward)
 * - if we are not playing then there is no need to update the timer
 */
export function getForceUpdate(previousUpdate: number, now: number): boolean {
  const isClockBehind = now < previousUpdate;
  const hasExceededRate = now - previousUpdate >= timerConfig.notificationRate;
  const newSeconds = millisToSeconds(previousUpdate) !== millisToSeconds(now);
  return isClockBehind || hasExceededRate || newSeconds;
}
