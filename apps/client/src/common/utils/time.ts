import { MaybeNumber, OffsetMode, OntimeEvent, Settings, TimeFormat } from 'ontime-types';
import { dayInMs, formatFromMillis, MILLIS_PER_HOUR, MILLIS_PER_MINUTE, MILLIS_PER_SECOND } from 'ontime-utils';

import { FORMAT_12, FORMAT_24 } from '../../viewerConfig';
import { APP_SETTINGS } from '../api/constants';
import { useTimeUntilData } from '../hooks/useSocket';
import { ontimeQueryClient } from '../queryClient';

/**
 * Returns current time in milliseconds from midnight
 * @returns {number}
 */
export function nowInMillis(): number {
  const now = new Date();

  // extract milliseconds since midnight
  let elapsed = now.getHours() * MILLIS_PER_HOUR;
  elapsed += now.getMinutes() * MILLIS_PER_MINUTE;
  elapsed += now.getSeconds() * MILLIS_PER_SECOND;
  elapsed += now.getMilliseconds();

  return elapsed;
}

/**
 * @description Resolves format from url and store
 * @return {string|null} A format string like "hh:mm:ss a" or null
 */
function getFormatFromParams() {
  const params = new URL(document.location.href).searchParams;
  return params.get('timeformat');
}

/**
 * Gets the format options from the applicaton settings
 * @returns a string equivalent to the format, ie: hh:mm:ss a or HH:mm:ss
 */
export function getFormatFromSettings(): TimeFormat {
  const settings: Settings | undefined = ontimeQueryClient.getQueryData(APP_SETTINGS);
  return settings?.timeFormat ?? '24';
}

export function getDefaultFormat(
  currentSettings?: TimeFormat,
  format12: string = FORMAT_12,
  format24: string = FORMAT_24,
): string {
  if (currentSettings === '12') {
    return format12;
  }
  return format24;
}

function resolveTimeFormat(fallback12: string, fallback24: string): string {
  // if the user has an option, we use that
  const formatFromParams = getFormatFromParams();
  if (formatFromParams) {
    return formatFromParams;
  }

  // otherwise we use the view defined, with respect to the 12-24 hour settings
  const formatFromSettings = getFormatFromSettings();
  if (formatFromSettings === '12') {
    return fallback12;
  }

  return fallback24;
}

type FormatOptions = {
  format12: string;
  format24: string;
};

/**
 * @description viewer specific utility function to format a date in 12 or 24 hour format
 * @param {MaybeNumber} milliseconds
 * @param {object} [options]
 * @param {string} [options.format.format12] format string if 12 hour time
 * @param {string} [options.format.format24] format string if 24 hour time
 * @param {Function} resolver DI for testing
 * @return {string}
 */
export const formatTime = (
  milliseconds: MaybeNumber,
  options?: FormatOptions,
  resolver = resolveTimeFormat,
): string => {
  if (milliseconds === null) {
    return '...';
  }

  const timeFormat = resolver(options?.format12 ?? FORMAT_12, options?.format24 ?? FORMAT_24);
  const display = formatFromMillis(Math.abs(milliseconds), timeFormat);

  const isNegative = milliseconds < 0;
  return `${isNegative ? '-' : ''}${display}`;
};

/**
 * Handles case for formatting a duration time
 * @param duration
 * @returns
 */
export function formatDuration(duration: number, hideSeconds = true): string {
  // durations should never be negative, we handle it here to flag if there is an issue in future
  if (duration <= 0) {
    return '0h 0m';
  }

  const hours = Math.floor(duration / MILLIS_PER_HOUR);
  const minutes = Math.floor((duration % MILLIS_PER_HOUR) / MILLIS_PER_MINUTE);
  let result = '';
  if (hours > 0) {
    result += `${hours}h`;
  }
  if (minutes > 0) {
    result += `${minutes}m`;
  }

  if (!hideSeconds) {
    const seconds = Math.floor((duration % MILLIS_PER_MINUTE) / MILLIS_PER_SECOND);
    if (seconds > 0) {
      result += `${seconds}s`;
    }
  }
  return result;
}

/**
 *
 * @param totalGap accumulated gap from the current event
 * @param isLinkedToLoaded is this event part of a chain linking back to the current loaded event
 * @returns
 */
export function useTimeUntilStart(
  // typed like this to make it very clear what the data is
  data: Pick<OntimeEvent, 'timeStart' | 'dayOffset' | 'delay'> & {
    totalGap: number;
    isLinkedToLoaded: boolean;
  },
): number {
  const { offset, clock, currentDay, offsetMode, actualStart, plannedStart } = useTimeUntilData();
  return calculateTimeUntilStart({ ...data, currentDay, clock, offset, offsetMode, actualStart, plannedStart });
}

/**
 *
 * @param currentDay the day offset of the urrently running event
 * @param totalGap accumulated gap from the current event
 * @param isLinkedToLoaded is this event part of a chain linking back to the current loaded event
 * @param clock
 * @param offset
 * @returns
 */
export function calculateTimeUntilStart(
  data: Pick<OntimeEvent, 'timeStart' | 'dayOffset' | 'delay'> & {
    currentDay: number;
    totalGap: number;
    isLinkedToLoaded: boolean;
    clock: number;
    offset: number;
    offsetMode: OffsetMode;
    actualStart: MaybeNumber;
    plannedStart: MaybeNumber;
  },
): number {
  const {
    timeStart,
    dayOffset,
    currentDay,
    totalGap,
    isLinkedToLoaded,
    clock,
    offset,
    delay,
    offsetMode,
    actualStart,
    plannedStart,
  } = data;

  //How many days from the currently running event to this one
  const relativeDayOffset = dayOffset - currentDay;

  const delayedStart = Math.max(0, timeStart + delay);

  //The normalised start time of this event relative to the currently running event
  const normalisedTimeStart = delayedStart + relativeDayOffset * dayInMs;

  let relativeStartOffset = 0;

  if (offsetMode === OffsetMode.Relative) {
    relativeStartOffset = (actualStart ?? 0) - (plannedStart ?? 0);
  }

  const scheduledTimeUntil = normalisedTimeStart - clock + relativeStartOffset;

  const offsetTimeUntil = scheduledTimeUntil - offset;

  if (isLinkedToLoaded) {
    //if we are directly linked back to the loaded event we just follow the offset
    return offsetTimeUntil;
  }

  const gapsCanCompensadeForOffset = totalGap + offset >= 0;
  if (gapsCanCompensadeForOffset) {
    // if we are ahead of schedule or the gap can compensate for the amount we are behind then expect to start at the scheduled time
    return scheduledTimeUntil;
  }

  // otherwise consume as much of the offset as possible with the gap
  const offsetTimeUntilBufferedByGaps = offsetTimeUntil - totalGap;
  return offsetTimeUntilBufferedByGaps;
}
