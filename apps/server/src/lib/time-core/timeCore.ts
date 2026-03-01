import { Duration, Instant, TimeOfDay } from 'ontime-types';
import { MILLIS_PER_MINUTE, dayInMs } from 'ontime-utils';

/** Returns the current instant */
export function now(): Instant {
  return Date.now() as Instant;
}

/**
 * Converts an instant to milliseconds since midnight in the local timezone
 * - Accounts for the system's timezone offset including DST
 * - Result is always in the range [0, dayInMs)
 */
export function toTimeOfDay(instant: Instant): TimeOfDay {
  const tzOffset = new Date(instant).getTimezoneOffset() * MILLIS_PER_MINUTE;
  return ((((instant - tzOffset) % dayInMs) + dayInMs) % dayInMs) as TimeOfDay;
}

/**
 * Returns the current time of day in milliseconds since midnight
 */
export function timeOfDayNow(): TimeOfDay {
  return toTimeOfDay(now());
}

/**
 * Converts a time of day to an instant anchored to the same day as the reference
 * - Uses the reference instant to determine which calendar day to anchor to
 */
export function toInstant(clock: TimeOfDay, reference: Instant): Instant {
  const referenceClock = toTimeOfDay(reference);
  const dayStart = reference - referenceClock;
  return (dayStart + clock) as Instant;
}

/**
 * Returns the duration elapsed since a past instant
 * Result is positive when 'since' is before 'now'
 */
export function timeSince(now: Instant, since: Instant): Duration {
  return (now - since) as Duration;
}

/**
 * Returns the duration remaining until a future instant
 * Result is positive when 'until' is after 'now'
 */
export function timeUntil(now: Instant, until: Instant): Duration {
  return (until - now) as Duration;
}

/**
 * Moves an instant forward or backward by a duration
 * Use a negative duration to move backward
 */
export function addDuration(instant: Instant, duration: Duration | Duration[]): Instant {
  const totalDuration = Array.isArray(duration) ? duration.reduce((total, current) => total + current, 0) : duration;

  return (instant + totalDuration) as Instant;
}
