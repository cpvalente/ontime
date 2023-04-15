import { formatFromMillis } from 'ontime-utils';

import { mth, mtm, mts } from './timeConstants';

export const timeFormat = 'HH:mm';
export const timeFormatSeconds = 'HH:mm:ss';

/**
 * another go at simpler string formatting (counters)
 * @description Converts seconds to string representing time
 * @param {number | null} milliseconds - time in seconds
 * @param {boolean} [hideZero] - whether to show hours in case its 00
 * @returns {string} String representing absolute time 00:12:02
 */
export function formatDisplay(milliseconds: number | null, hideZero = false): string {
  if (typeof milliseconds !== 'number') {
    return hideZero ? '00:00' : '00:00:00';
  }

  // add an extra 0 if necessary
  const format = (val: number) => `0${Math.floor(val)}`.slice(-2);

  const s = Math.abs(millisToSeconds(milliseconds));
  const hours = Math.floor((s / 3600) % 24);
  const minutes = Math.floor((s % 3600) / 60);

  if (hideZero && hours < 1) return [minutes, s % 60].map(format).join(':');
  return [hours, minutes, s % 60].map(format).join(':');
}

/**
 * @description Converts milliseconds to seconds
 * @param {number | null} millis - time in seconds
 * @returns {number} Amount in seconds
 */
export const millisToSeconds = (millis: number | null): number => {
  if (millis === null) {
    return 0;
  }
  return millis < 0 ? Math.ceil(millis / mts) : Math.floor(millis / mts);
};

/**
 * @description Converts milliseconds to seconds
 * @param {number} millis - time in seconds
 * @returns {number} Amount in seconds
 */
export const millisToMinutes = (millis: number): number => {
  return millis < 0 ? Math.ceil(millis / mtm) : Math.floor(millis / mtm);
};

/**
 * @description Validates a time string
 * @param {string} string - time string "23:00:12"
 * @returns {boolean} string represents time
 */
export const isTimeString = (string: string): boolean => {
  // ^                   # Start of string
  // (?:                 # Try to match...
  //  (?:                #  Try to match...
  //   ([01]?\d|2[0-3]): #   HH:
  //  )?                 #  (optionally).
  //  ([0-5]?\d):        #  MM: (required)
  // )?                  # (entire group optional, so either HH:MM:, MM: or nothing)
  // ([0-5]?\d)          # SS (required)
  // $                   # End of string

  const regex = /^(?:(?:([01]?\d|2[0-3])[:,.])?([0-5]?\d)[:,.])?([0-5]?\d)$/;
  return regex.test(string);
};

/**
 * @description safe parse string to int
 * @param {string} valueAsString
 * @return {number}
 */
const parse = (valueAsString: string): number => {
  const parsed = parseInt(valueAsString, 10);
  if (isNaN(parsed)) {
    return 0;
  }
  return Math.abs(parsed);
};

/**
 * @description Parses a time string to millis
 * @param {string} value - time string
 * @param {boolean} fillLeft - autofill left = hours / right = seconds
 * @returns {number} - time string in millis
 */
export const forgivingStringToMillis = (value: string, fillLeft = true): number => {
  let millis = 0;

  const hours = parseInt(value.match(/(\d+)h/)?.[0] ?? 0, 10);
  const minutes = parseInt(value.match(/(\d+)m/)?.[0] ?? 0, 10);
  const seconds = parseInt(value.match(/(\d+)s/)?.[0] ?? 0, 10);

  if (hours > 0 || minutes > 0 || seconds > 0) {
    millis = hours * mth + minutes * mtm + seconds * mts;
  } else {
    // split string at known separators    : , .
    const separatorRegex = /[\s,:.]+/;
    const [first, second, third] = value.split(separatorRegex);

    if (first != null && second != null && third != null) {
      // if string has three sections, treat as [hours] [minutes] [seconds]
      millis = parse(first) * mth;
      millis += parse(second) * mtm;
      millis += parse(third) * mts;
    } else if (first != null && second == null && third == null) {
      // if string has one section,
      // could be a complete string like 121010 - 12:10:10
      if (first.length === 6) {
        const hours = first.substring(0, 2);
        const minutes = first.substring(2, 4);
        const seconds = first.substring(4);
        millis = parse(hours) * mth;
        millis += parse(minutes) * mtm;
        millis += parse(seconds) * mts;
      } else {
        // otherwise lets treat as [minutes]
        millis = parse(first) * mtm;
      }
    }
    if (first != null && second != null && third == null) {
      // if string has two sections
      if (fillLeft) {
        // treat as [hours] [minutes]
        millis = parse(first) * mth;
        millis += parse(second) * mtm;
      } else {
        // treat as [minutes] [seconds]
        millis = parse(first) * mtm;
        millis += parse(second) * mts;
      }
    }
  }

  return millis;
};

export function millisToDelayString(millis: number | null): undefined | string | null {
  if (millis == null || millis === 0) {
    return null;
  }

  const isNegative = millis < 0;
  const absMillis = Math.abs(millis);

  if (absMillis < mtm) {
    return `${isNegative ? '-' : '+'}${formatFromMillis(absMillis, 's')}sec`;
  } else if (absMillis < mth && absMillis % mtm === 0) {
    return `${isNegative ? '-' : '+'}${formatFromMillis(absMillis, 'm')}min`;
  } else {
    return `${isNegative ? '-' : '+'}${formatFromMillis(absMillis, 'HH:mm:ss')}`;
  }
}
