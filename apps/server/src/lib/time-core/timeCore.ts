import { Day, Duration, Instant, TimeOfDay } from 'ontime-types';
import { MILLIS_PER_HOUR, MILLIS_PER_MINUTE, dayInMs } from 'ontime-utils';

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

function getMiddayReference(reference: Instant): Instant {
  return toInstant((12 * MILLIS_PER_HOUR) as TimeOfDay, reference);
}

/**
 * Converts a time of day to its closest instant to the reference
 * - Picks the previous or next day when the same day is more than 12 hours away
 * - Anchors day shifts to noon so they land on the intended calendar day across DST changes
 */
export function toNearestInstant(clock: TimeOfDay, reference: Instant): Instant {
  const sameDay = toInstant(clock, reference);
  const distance = sameDay - reference;
  if (Math.abs(distance) <= 12 * MILLIS_PER_HOUR) {
    return sameDay;
  }
  const noon = getMiddayReference(reference);
  const dayShift = distance > 0 ? -dayInMs : dayInMs;
  return toInstant(clock, addDuration(noon, dayShift as Duration));
}

/**
 * Converts a time of day to its next instant at or after the reference
 * - Anchors the day shift to noon so it lands on the next calendar day across DST changes
 */
export function toNextInstant(clock: TimeOfDay, reference: Instant): Instant {
  const sameDay = toInstant(clock, reference);
  if (sameDay >= reference) return sameDay;

  const noon = getMiddayReference(reference);
  return toInstant(clock, addDuration(noon, dayInMs as Duration));
}

/**
 * Returns the duration elapsed since a past instant
 * Result is positive when `since` is before `now`
 */
export function timeSince(now: Instant, since: Instant): Duration {
  return (now - since) as Duration;
}

/**
 * Returns the duration remaining until a future instant
 * Result is positive when `until` is after `now`
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
