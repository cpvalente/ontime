import { MILLIS_PER_MINUTE } from './conversionUtils.js';

/**
 * Checks whether a string is an IANA timezone name the runtime understands
 */
export function isValidTimezone(zone: string): boolean {
  if (!zone) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Returns the UTC offset of an IANA timezone at a given instant
 * - Result is in minutes, positive east of UTC (eg. Europe/Berlin in winter is 60)
 * - Accounts for DST at the given instant
 */
export function getTimezoneOffsetMinutes(zone: string, instant: number): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  });

  const parts: Record<string, number> = {};
  for (const { type, value } of formatter.formatToParts(instant)) {
    if (type !== 'literal') parts[type] = Number(value);
  }

  // the zone's wall clock, read as if it were UTC, minus the actual instant is the zone offset
  const wallClockAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  const instantToSecond = Math.floor(instant / 1000) * 1000;
  return Math.round((wallClockAsUtc - instantToSecond) / MILLIS_PER_MINUTE);
}
