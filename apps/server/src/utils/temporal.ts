import { Maybe } from 'ontime-types';
import { dayInMs, MILLIS_PER_MINUTE } from 'ontime-utils';

const tzOffset = new Date().getTimezoneOffset() * MILLIS_PER_MINUTE;

export type Instant = number & { __brand: 'instant' };
export type Duration = number & { __brand: 'duration' };

export const getInstant = (): Instant => Date.now() as Instant;

export function clockToInstant(clock: null): null;
export function clockToInstant(clock: number): Instant;
export function clockToInstant(clock: Maybe<number>): Maybe<Instant>;
export function clockToInstant(clock: Maybe<number>): Maybe<Instant> {
  if (clock === null) return null;
  const now = getInstant();
  const day = now - timeNow();
  return (day + clock) as Instant;
}

export function instantToClock(instant: null): null;
export function instantToClock(instant: Instant): number;
export function instantToClock(instant: Maybe<Instant>): Maybe<number>;
export function instantToClock(instant: Maybe<Instant>): Maybe<number> {
  if (instant === null) return null;
  return (instant % dayInMs) - tzOffset;
}

/**
 * The old clock function
 * is here until is is no longer needed for reference
 */
function timeNow() {
  const now = new Date();

  // extract milliseconds since midnight
  let elapsed = now.getHours() * 3600000;
  elapsed += now.getMinutes() * 60000;
  elapsed += now.getSeconds() * 1000;
  elapsed += now.getMilliseconds();
  return elapsed;
}
