import { Maybe } from 'ontime-types';
import { dayInMs, MILLIS_PER_MINUTE } from 'ontime-utils';

export type Epoch = number & { __brand: 'epoch' };

/**
 * get the current instant in time irrespective of timezone
 * @returns {number}
 */
export const getEpoch = (): Epoch => Date.now() as Epoch;

/**
 * convert a 24 hour clamped value into the corresponding epoch
 * @param {(number|null)} clock
 * @returns {(number|null)}
 */
export function clockToEpoch(clock: null): null;
export function clockToEpoch(clock: number): Epoch;
export function clockToEpoch(clock: Maybe<number>): Maybe<Epoch>;
export function clockToEpoch(clock: Maybe<number>): Maybe<Epoch> {
  if (clock === null) return null;
  const now = getEpoch();
  const timePart = epochToClock(now);
  const dayPart = now - timePart;
  return (dayPart + clock) as Epoch;
}

/**
 * convert a epoch into a 24 hour clamp value adjusted for timezone
 * @param {(number|null)} instant
 * @returns {(number|null)}
 */
export function epochToClock(instant: null): null;
export function epochToClock(instant: Epoch): number;
export function epochToClock(instant: Maybe<Epoch>): Maybe<number>;
export function epochToClock(instant: Maybe<Epoch>): Maybe<number> {
  if (instant === null) return null;
  const tzOffset = new Date().getTimezoneOffset() * MILLIS_PER_MINUTE;
  return (instant - tzOffset) % dayInMs;
}
