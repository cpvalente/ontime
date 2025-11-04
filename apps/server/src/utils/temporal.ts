import { Maybe } from 'ontime-types';
import { dayInMs, MILLIS_PER_MINUTE } from 'ontime-utils';

export type Instant = number & { __brand: 'instant' };

/**
 * get the current instant in time irrespective of timezone
 * @returns {number}
 */
export const getInstant = (): Instant => Date.now() as Instant;

/**
 * convert a 24 hour clamped value into the corresponding instance
 * @param {(number|null)} clock
 * @returns {(number|null)}
 */
export function clockToInstant(clock: null): null;
export function clockToInstant(clock: number): Instant;
export function clockToInstant(clock: Maybe<number>): Maybe<Instant>;
export function clockToInstant(clock: Maybe<number>): Maybe<Instant> {
  if (clock === null) return null;
  const now = getInstant();
  const timePart = instantToClock(now);
  const dayPart = now - timePart;
  return (dayPart + clock) as Instant;
}

/**
 * convert a instant into a 24 hour clamp value adjusted for timezone
 * @param {(number|null)} instant
 * @returns {(number|null)}
 */
export function instantToClock(instant: null): null;
export function instantToClock(instant: Instant): number;
export function instantToClock(instant: Maybe<Instant>): Maybe<number>;
export function instantToClock(instant: Maybe<Instant>): Maybe<number> {
  if (instant === null) return null;
  const tzOffset = new Date().getTimezoneOffset() * MILLIS_PER_MINUTE;
  return (instant - tzOffset) % dayInMs;
}
