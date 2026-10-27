import { Day, Duration, Instant, TimeOfDay } from 'ontime-types';
import { MILLIS_PER_MINUTE, dayInMs } from 'ontime-utils';

/** Returns the current instant */
export function now(): Instant {
  return Date.now() as Instant;
}

/**
 * Returns the offset of the local timezone from UTC at the given instant, in milliseconds
 * - Positive east of UTC, so local time is instant + offset
 * - Accounts for DST
 */
export function getTimezoneOffset(instant: Instant): Duration {
  // getTimezoneOffset is positive west of UTC, subtracting from 0 avoids returning -0 for UTC
  return (0 - new Date(instant).getTimezoneOffset() * MILLIS_PER_MINUTE) as Duration;
}

/**
 * Converts an instant to milliseconds since midnight in the local timezone
 * - Accounts for the system's timezone offset including DST
 * - Result is always in the range [0, dayInMs)
 */
export function toTimeOfDay(instant: Instant): TimeOfDay {
  return ((((instant + getTimezoneOffset(instant)) % dayInMs) + dayInMs) % dayInMs) as TimeOfDay;
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

/**
 * Calculates elapsed time on the clock from a starting time to the current time
 * Handles overnight crossing (when current < start, assumes we've crossed midnight)
 */
export function elapsedTime(current: TimeOfDay, start: TimeOfDay): Duration {
  return (current < start ? current + dayInMs - start : current - start) as Duration;
}

/**
 * Calculates the number of calendar days elapsed since a start epoch
 * Uses local midnight as day boundaries (DST-safe via timezone offset)
 */
export function daysSinceStart(startEpoch: Instant, currentEpoch: Instant): Day {
  const startOffset = new Date(startEpoch).getTimezoneOffset() * MILLIS_PER_MINUTE;
  const currentOffset = new Date(currentEpoch).getTimezoneOffset() * MILLIS_PER_MINUTE;

  const startDaySerial = Math.floor((startEpoch - startOffset) / dayInMs);
  const currentDaySerial = Math.floor((currentEpoch - currentOffset) / dayInMs);

  return (currentDaySerial - startDaySerial) as Day;
}
