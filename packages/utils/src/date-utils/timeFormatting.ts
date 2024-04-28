import type { MaybeNumber } from 'ontime-types';

import { millisToHours, millisToMinutes, millisToSeconds } from './conversionUtils.js';

function pad(val: number): string {
  return String(val).padStart(2, '0');
}

type FormatOptions = {
  fallback?: string;
};

/**
 * Converts a value in milliseconds to its time tag
 * @param millis time to convert
 * @param options optional overloads for format
 * @returns formatted time such as 12:00:00
 */
export function millisToString(millis?: MaybeNumber, options?: FormatOptions): string {
  if (millis == null) {
    return options?.fallback ?? '...';
  }

  const absoluteMillis = Math.abs(millis);
  const seconds = millisToSeconds(absoluteMillis) % 60;
  const minutes = millisToMinutes(absoluteMillis) % 60;
  const hours = millisToHours(absoluteMillis);
  const isNegative = millis < 0;

  return `${isNegative ? '-' : ''}${[hours, minutes, seconds].map(pad).join(':')}`;
}

/**
 * Receives a string such as 00:10:10 and removes the hours field if it is 00
 * @param timer
 */
export function removeLeadingZero(timer: string): string {
  if (timer.startsWith('00:0')) {
    return timer.slice(4);
  }
  if (timer.startsWith('00:')) {
    return timer.slice(3);
  }
  if (timer.startsWith('-00:0')) {
    return `-${timer.slice(5)}`;
  }
  if (timer.startsWith('-00:')) {
    return `-${timer.slice(4)}`;
  }
  return timer;
}

/**
 * Receives a string such as 00:10:10 and removes the seconds field if it is 00
 * @param timer
 */
export function removeTrailingZero(timer: string): string {
  if (timer.endsWith(':00')) {
    return timer.slice(0, -3);
  }
  return timer;
}

/**
 * Receives a string such as 00:10:10 and removes the seconds field
 * @param timer
 */
export function removeSeconds(timer: string): string {
  return timer.slice(0, -3);
}

/**
 * Formats a given date into a custom string format based on UTC time.
 * 
 * @param millis - The number of milliseconds.
 * @param format - A string specifying the desired output format. 
 *                 For example, 'yyyy-MM-dd HH:mm:ss' will format the date as '2024-01-23 09:41:08'.
 * 
 * @returns The formatted date as a string according to the provided `format` string.
 * 
 * @throws Will throw an error if the date formatting fails or the regex match returns null, which should not happen
 *         if the `Intl.DateTimeFormat` is correctly configured and the input `millis` is valid.
 * 
 * @throws Will throw an error if the input @param millis is smaller than zero.
 */
export function formatFromMillis(millis: number, format: string): string {
  if (millis < 0) {
    throw new Error("Input `millis` can't be smaller than zero.");
  }

  const date: Date = new Date(millis);
  const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      hourCycle: 'h23', // Ensures the hour is always two digits
      timeZone: 'UTC'
  };

  const formattedDate: string = date.toLocaleString('en-US', options);
  const milliseconds: string = date.getUTCMilliseconds().toString().padStart(3, '0');

  // Extract date and time components.
  const match = formattedDate.match(/(\d{2})\/(\d{2})\/(\d{4}), (\d{2}):(\d{2}):(\d{2})/);
  if (!match) {
      throw new Error("Date format mismatch or null result from regex match.");
  }

  const [_, month, day, year, hour24, minute, second] = match;

  // Calculate the 12-hour format by adjusting the 24-hour time.
  const hour12 = ((parseInt(hour24) + 11) % 12 + 1);

  const replacements: Record<string, string> = {
      'yyyy': year,
      'MM': month,
      'dd': day,
      'HH': hour24,
      'mm': minute,
      'ss': second,
      'S': milliseconds,
      'h': hour12.toString(), // Non-padded 12-hour format
      'hh': hour12.toString().padStart(2, '0'), // Padded 12-hour format
      'H': parseInt(hour24).toString(), // Non-padded 24-hour format
      's': second,
      'm': minute,
      'a': parseInt(hour24) >= 12 ? 'PM' : 'AM'
  };

  return applyReplacements(format, replacements);
}

/**
 * Applies replacements to a template string based on a dictionary of tokens and their corresponding values.
 *
 * @param {string} template - The format template string containing tokens to be replaced.
 * @param {Record<string, string>} replacements - A record of tokens and their corresponding values.
 * @returns {string} The formatted string with all tokens replaced by their values.
 */
function applyReplacements(template: string, replacements: Record<string, string>) {
  return Object.keys(replacements).reduce((result, token) => {
      const regex = new RegExp(`\\b${token}\\b`, 'g');
      return result.replace(regex, replacements[token]);
  }, template);
}
