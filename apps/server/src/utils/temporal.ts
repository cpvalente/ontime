import { DayMs, EpochMs, Maybe } from 'ontime-types';
import { dayInMs, MILLIS_PER_MINUTE } from 'ontime-utils';

/**
 * get the current instant in time irrespective of timezone
 * @returns {number}
 */
export const getEpoch = (): EpochMs => Date.now() as EpochMs;

/**
 * convert a 24 hour clamped value into the corresponding epoch
 * @param {(number|null)} clock
 * @returns {(number|null)}
 */
export function clockToEpoch(clock: null): null;
export function clockToEpoch(clock: DayMs): EpochMs;
export function clockToEpoch(clock: Maybe<DayMs>): Maybe<EpochMs>;
export function clockToEpoch(clock: Maybe<DayMs>): Maybe<EpochMs> {
  if (clock === null) return null;
  const now = getEpoch();
  const timePart = epochToClock(now);
  const dayPart = now - timePart;
  return (dayPart + clock) as EpochMs;
}

/**
 * convert a epoch into a 24 hour clamp value adjusted for timezone
 * @param {(number|null)} instant
 * @returns {(number|null)}
 */
export function epochToClock(instant: null): null;
export function epochToClock(instant: EpochMs): DayMs;
export function epochToClock(instant: Maybe<EpochMs>): Maybe<DayMs>;
export function epochToClock(instant: Maybe<EpochMs>): Maybe<DayMs> {
  if (instant === null) return null;
  const tzOffset = new Date().getTimezoneOffset() * MILLIS_PER_MINUTE;
  return ((instant - tzOffset) % dayInMs) as DayMs;
}
