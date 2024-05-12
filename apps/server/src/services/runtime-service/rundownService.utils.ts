import { millisToSeconds } from 'ontime-utils';

import { timerConfig } from '../../config/config.js';
import { MaybeNumber } from 'ontime-types';

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
export function getShouldTimerUpdate(previousValue: number, currentValue: MaybeNumber): boolean {
  if (currentValue === null) {
    return false;
  }
  // we avoid trigger ahead since it can cause duplicate triggers
  // we force the timer value to be negative because we need a ceiling reduction
  const shouldUpdateTimer = millisToSeconds(-currentValue) !== millisToSeconds(-previousValue);
  return shouldUpdateTimer;
}

/**
 * In some cases we want to force an update to the timer
 * - if the clock has slid back
 * - if we have escaped the update rate (clock slid forward)
 */
export function getForceUpdate(previousUpdate: number, now: number): boolean {
  const isClockBehind = now < previousUpdate;
  const hasExceededRate = now - previousUpdate >= timerConfig.notificationRate;
  return isClockBehind || hasExceededRate;
}
