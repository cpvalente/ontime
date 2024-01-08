import { MaybeNumber, Settings, TimeFormat } from 'ontime-types';
import { formatFromMillis } from 'ontime-utils';

import { FORMAT_12, FORMAT_24 } from '../../viewerConfig';
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
  return params.get('timeformat');
}

/**
 * Gets the format options from the applicaton settings
 * @returns a string equivalent to the format, ie: hh:mm:ss a or HH:mm:ss
 */
export function getFormatFromSettings(): TimeFormat {
  const settings: Settings | undefined = ontimeQueryClient.getQueryData(APP_SETTINGS);
  return settings?.timeFormat ?? '24';
}

export function getDefaultFormat(
  currentSettings?: TimeFormat,
  format12: string = FORMAT_12,
  format24: string = FORMAT_24,
): string {
  if (currentSettings === '12') {
    return format12;
  }
  return format24;
}

function resolveTimeFormat(fallback12: string, fallback24: string): string {
  // if the user has an option, we use that
  const formatFromParams = getFormatFromParams();
  if (formatFromParams) {
    return formatFromParams;
  }

  // otherwise we use the view defined, with respect to the 12-24 hour settings
  const formatFromSettings = getFormatFromSettings();
  if (formatFromSettings === '12') {
    return fallback12;
  }

  return fallback24;
}

type FormatOptions = {
  format12: string;
  format24: string;
};

/**
 * @description viewer specific utility function to format a date in 12 or 24 hour format
 * @param {MaybeNumber} milliseconds
 * @param {object} [options]
 * @param {string} [options.format.format12] format string if 12 hour time
 * @param {string} [options.format.format24] format string if 24 hour time
 * @param {Function} resolver DI for testing
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

  const timeFormat = resolver(options?.format12 ?? FORMAT_12, options?.format24 ?? FORMAT_24);
  const display = formatFromMillis(Math.abs(milliseconds), timeFormat);

  const isNegative = milliseconds < 0;
  return `${isNegative ? '-' : ''}${display}`;
};
