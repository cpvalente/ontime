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
 * @param format - A string specifying the desired output format, with placeholders for year ('yyyy'), month ('MM'),
 *                 day ('dd'), hour ('HH'), minute ('mm'), and second ('ss'). 
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
    hourCycle: 'h23',  // ensures hour is always two digits (00-23)
    timeZone: 'UTC'
  };

  const formattedDate: string = date.toLocaleString('en-US', options);
  
  // Extract date and time components.
  const match = formattedDate.match(/(\d{2})\/(\d{2})\/(\d{4}), (\d{2}):(\d{2}):(\d{2})/);
  
  if (!match) {
    throw new Error("Date format mismatch or null result from regex match.");
  }

  const [_, month, day, year, hour, minute, second] = match;

  const replacements: Record<string, string> = {
    'yyyy': year,
    'MM': month,
    'dd': day,
    'HH': hour,
    'mm': minute,
    'ss': second
  };

  // Replace each token in the format string with the corresponding date part.
  return Object.keys(replacements).reduce(
    (result: string, token: string) => result.replace(new RegExp(token, 'g'), replacements[token]), format
  );
}
