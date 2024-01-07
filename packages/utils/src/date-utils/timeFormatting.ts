import { millisToHours, millisToMinutes, millisToSeconds } from './conversionUtils.js';

/**
 * TODO: cleanup ways of converting time
 * - a way used in production views, where millis show a full time string
 * - a way used in views, where the string is formatted by a option
 * - ? a way used in timer where we create a string "2min 30sec"
 * See as inspiration: https://github.com/bitfocus/companion-module-stagetimerio-api/blob/main/src/utils.js
 */

function pad(val: number): string {
  return String(val).padStart(2, '0');
}

type MaybeNumber = number | null;
type FormatOptions = {
  fallback?: string;
};

export function millisToString(millis?: MaybeNumber, options?: FormatOptions): string {
  if (millis == null) {
    return options?.fallback ?? '...';
  }

  const absoluteMillis = Math.abs(millis);
  const seconds = millisToSeconds(absoluteMillis) % 60;
  const minutes = millisToMinutes(absoluteMillis) % 60;
  const hours = millisToHours(absoluteMillis) % 24;

  const isNegative = millis < 0;

  return `${isNegative ? '-' : ''}${[hours, minutes, seconds].map(pad).join(':')}`;
}

/**
 * Receives a string such as 00:10:10 and removes the hours field if it is 00
 * @param timer
 */
export function removePrependedZero(timer: string): string {
  if (timer.startsWith('00:0')) {
    return timer.slice(4);
  }
  if (timer.startsWith('00:')) {
    return timer.slice(3);
  }
  if (timer.startsWith('-00:0')) {
    return timer.slice(5);
  }
  if (timer.startsWith('-00:')) {
    return timer.slice(4);
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
