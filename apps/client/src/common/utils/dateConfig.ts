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
 * @description Parses a time string to millis, auto-filling to the left
 * @param {string} value - time string
 * @returns {number} - time string in millis
 */
export const forgivingStringToMillis = (value: string): number => {
  let millis = 0;

  const hoursMatch = value.match(/(\d+)h/);
  const hours = hoursMatch ? parse(hoursMatch[1]) : 0;

  const minutesMatch = value.match(/(\d+)m/);
  const minutes = minutesMatch ? parse(minutesMatch[1]) : 0;

  const secondsMatch = value.match(/(\d+)s/);
  const seconds = secondsMatch ? parse(secondsMatch[1]) : 0;

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
      // we only have one section, infer separators

      const length = first.length;
      if (length === 1) {
        millis = parse(first) * mtm;
      } else if (length === 2) {
        millis = parse(first) * mtm;
      } else if (length === 3) {
        millis = parse(first[0]) * mth + parse(first.substring(1)) * mtm;
      } else if (length === 4) {
        millis = parse(first.substring(0, 2)) * mth + parse(first.substring(2)) * mtm;
      } else if (length === 5) {
        const hours = parse(first.substring(0, 2));
        const minutes = parse(first.substring(2, 4));
        const seconds = parse(first.substring(4));
        millis = hours * mth + minutes * mtm + seconds * mts;
      } else if (length >= 6) {
        const hours = parse(first.substring(0, 2));
        const minutes = parse(first.substring(2, 4));
        const seconds = parse(first.substring(4));
        millis = hours * mth + minutes * mtm + seconds * mts;
      }
    }
    if (first != null && second != null && third == null) {
      millis = parse(first) * mth;
      millis += parse(second) * mtm;
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
