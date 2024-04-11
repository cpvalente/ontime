import { DateTime } from 'luxon';
import { MaybeNumber } from 'ontime-types';

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
 * @description utility function to format a date in milliseconds using luxon
 * @param {number} millis
 * @param {string} format
 * @return {string}
 */
export function formatFromMillis(millis: number, format: string): string {
  return DateTime.fromMillis(millis).toUTC().toFormat(format);
}
