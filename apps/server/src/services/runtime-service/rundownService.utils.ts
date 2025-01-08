import { millisToUISeconds } from 'ontime-utils';

import { timerConfig } from '../../config/config.js';
import { MaybeNumber, Playback } from 'ontime-types';

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
  const isClockSecondAhead = millisToUISeconds(now) !== millisToUISeconds(previousUpdate + timerConfig.triggerAhead);
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
  const shouldUpdateTimer = millisToUISeconds(currentValue) !== millisToUISeconds(previousValue);
  return shouldUpdateTimer;
}

/**
 * In some cases we want to force an update to the timer
 * - if the clock has slid back
 * - if we have escaped the update rate (clock slid forward)
 * - if we are not playing then there is no need to update the timer
 */
export function getForceUpdate(previousUpdate: number, now: number, playbackState: Playback = Playback.Play): boolean {
  if (playbackState !== Playback.Play) return false;
  const isClockBehind = now < previousUpdate;
  const hasExceededRate = now - previousUpdate >= timerConfig.notificationRate;
  return isClockBehind || hasExceededRate;
}
