import type { MaybeNumber, TimeFormat, TimerType } from 'ontime-types';

import { millisToSeconds, secondsToHours, secondsToMinutes } from './conversionUtils.js';

export function pad(val: number): string {
  return String(val).padStart(2, '0');
}

type FormatOptions = {
  fallback?: string;
  direction?: TimerType.CountDown | TimerType.CountUp;
  timeFormat?: TimeFormat;
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

  const isNegative = millis < 0;

  const totalSeconds = Math.abs(millisToSeconds(millis, options?.direction));
  const seconds = totalSeconds % 60;
  const minutes = secondsToMinutes(totalSeconds) % 60;
  let hours = secondsToHours(totalSeconds);

  if (options?.timeFormat === '12') {
    hours = hours % 12;
  }

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
 *                 For example, 'ss' will format the millis as '07' seconds.
 *
 * @returns The formatted date as a string according to the provided `format` string.
 *          If input `millis` is smaller than zero, it returns undefined.
 *
 */
export function formatFromMillis(millis: number, format: string): string | undefined {
  if (millis < 0) {
    return undefined;
  }

  const date: Date = new Date(millis);

  const hour24Padded = date.getUTCHours().toString().padStart(2, '0');
  const hour24 = date.getUTCHours().toString();
  const minutePadded = date.getUTCMinutes().toString().padStart(2, '0');
  const minute = date.getUTCMinutes().toString();
  const secondPadded = date.getUTCSeconds().toString().padStart(2, '0');
  const second = date.getUTCSeconds().toString();
  const milliseconds = date.getUTCMilliseconds().toString().padStart(3, '0');
  const hour12 = (date.getUTCHours() % 12 || 12).toString();
  const hour12Padded = hour12.padStart(2, '0');
  const amPm = date.getUTCHours() >= 12 ? 'PM' : 'AM';

  const replacements: Record<string, string> = {
    HH: hour24Padded,
    H: hour24,
    hh: hour12Padded,
    h: hour12,
    mm: minutePadded,
    m: minute,
    ss: secondPadded,
    s: second,
    S: milliseconds,
    a: amPm,
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
function applyReplacements(template: string, replacements: Record<string, string>): string {
  return Object.keys(replacements).reduce((result, token) => {
    const regex = new RegExp(`\\b${token}\\b`, 'g');
    return result.replace(regex, replacements[token]);
  }, template);
}
