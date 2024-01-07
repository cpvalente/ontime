import { MaybeNumber, Settings } from 'ontime-types';
import { formatFromMillis } from 'ontime-utils';

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
 * @return {string|null} A format string like "hh:mm:ss a" or null
 */
function getFormatFromParams() {
  const params = new URL(document.location.href).searchParams;
  return params.get('format');
}

/**
 * Gets the format options from the applicaton settings
 * @returns a string equivalent to the format, ie: hh:mm:ss a or HH:mm:ss
 */
export function getFormatFromSettings() {
  const settings: Settings | undefined = ontimeQueryClient.getQueryData(APP_SETTINGS);
  return settings?.timeFormat === '12' ? 'hh:mm:ss a' : 'HH:mm:ss';
}

function resolveTimeFormat(fallback: string = 'HH:mm:ss') {
  const formatFromParams = getFormatFromParams();
  if (formatFromParams) {
    return formatFromParams;
  }

  const formatFromSettings = getFormatFromSettings();
  if (formatFromSettings) {
    return formatFromSettings;
  }

  return fallback;
}

type FormatOptions = {
  format?: string;
};

/**
 * @description utility function to format a date in 12 or 24 hour format
 * @param {MaybeNumber} milliseconds
 * @param {object} [options]
 * @param {string} [options.format]
 * @param {function} resolver DI for testing
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

  const timeFormat = resolver(options?.format);

  const isNegative = (milliseconds ?? 0) < 0;
  const display = formatFromMillis(Math.abs(milliseconds), timeFormat);
  return `${isNegative ? '-' : ''}${display}`;
};
