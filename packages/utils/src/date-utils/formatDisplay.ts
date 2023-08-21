import { mts } from '../timeConstants.js';

/**
 * another go at simpler string formatting (counters) -- Copied from client code
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

export const millisToSeconds = (millis: number | null): number => {
  if (millis === null) {
    return 0;
  }
  return millis < 0 ? Math.ceil(millis / mts) : Math.floor(millis / mts);
};
