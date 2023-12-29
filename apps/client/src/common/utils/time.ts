import { Settings } from 'ontime-types';
import { formatFromMillis, millisToString } from 'ontime-utils';

import { APP_SETTINGS } from '../api/apiConstants';
import { ontimeQueryClient } from '../queryClient';

/**
 * Returns current time in milliseconds
 * @returns {number}
 */
export const nowInMillis = () => {
  const now = new Date();

  // extract milliseconds since midnight
  let elapsed = now.getHours() * 3600000;
  elapsed += now.getMinutes() * 60000;
  elapsed += now.getSeconds() * 1000;
  elapsed += now.getMilliseconds();

  return elapsed;
};

/**
 * @description Resolves format from url and store
 * @return {string|undefined}
 */
export const resolveTimeFormat = () => {
  const params = new URL(document.location.href).searchParams;
  const urlOptions = params.get('format');
  const settings: Settings | undefined = ontimeQueryClient.getQueryData(APP_SETTINGS);

  return urlOptions || settings?.timeFormat;
};

type FormatOptions = {
  showSeconds?: boolean;
  format?: string;
};

/**
 * @description utility function to format a date in 12 or 24 hour format
 * @param {number | null} milliseconds
 * @param {object} [options]
 * @param {boolean} [options.showSeconds]
 * @param {string} [options.format]
 * @param {function} resolver
 * @return {string}
 */
export const formatTime = (
  milliseconds: number | null,
  options?: FormatOptions,
  resolver = resolveTimeFormat,
): string => {
  if (milliseconds === null) {
    return '...';
  }
  const timeFormat = resolver();
  const fallback = options?.showSeconds ? 'hh:mm:ss a' : 'hh:mm a';
  const { showSeconds = false, format: formatString = fallback } = options || {};
  const isNegative = (milliseconds ?? 0) < 0;
  const display =
    timeFormat === '12'
      ? formatFromMillis(Math.abs(milliseconds), formatString)
      : millisToString(Math.abs(milliseconds), showSeconds);
  return `${isNegative ? '-' : ''}${display}`;
};
