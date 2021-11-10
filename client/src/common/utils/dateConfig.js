export const timeFormat = 'HH:mm';
export const timeFormatSeconds = 'HH:mm:ss';

/**
 * @description Converts milliseconds to string representing time
 * @param {number} ms - time in milliseconds
 * @param {boolean} showSeconds - wether to show the seconds
 * @param {string} delim - character between HH MM SS
 * @param {string} ifNull - what to return if value is null
 * @returns {string} String representing time 00:12:02
 */

// This is shared and tested in backend in time.js
export const stringFromMillis = (
  ms,
  showSeconds = true,
  delim = ':',
  ifNull = '...'
) => {
  if (ms === null || isNaN(ms)) return ifNull;
  const isNegative = ms < 0 ? '-' : '';
  const showWith0 = (value) => (value < 10 ? `0${value}` : value);
  const hours = showWith0(Math.floor(((ms / (1000 * 60 * 60)) % 60) % 24));
  const minutes = showWith0(Math.floor((ms / (1000 * 60)) % 60));
  const seconds = showWith0(Math.floor((ms / 1000) % 60));

  return showSeconds
    ? `${isNegative}${
        parseInt(hours) ? `${hours}${delim}` : `00${delim}`
      }${minutes}${delim}${seconds}`
    : `${isNegative}${parseInt(hours) ? `${hours}` : '00'}${delim}${minutes}`;
};

/**
 * another go at simpler string formatting (counters)
 * @description Converts seconds to string representing time
 * @param {number} seconds - time in seconds
 * @param {boolean} hideZero - wether to show hours in case its 00
 * @returns {string} String representing absolute time 00:12:02
 */

export function formatDisplay(seconds, hideZero) {
  // handle floating point crazyness
  const format = (val) => `0${Math.floor(val)}`.slice(-2);

  let s = Math.abs(seconds);
  const hours = (s / 3600) % 24;
  const minutes = (s % 3600) / 60;

  if (hideZero && hours < 1) return [minutes, s % 60].join(':');
  else return [hours, minutes, s % 60].map(format).join(':');
}

/**
 * @description Converts milliseconds to seconds
 * @param {number} millis - time in seconds
 * @param {boolean} hideZero - wether to show hours in case its 00
 * @returns {number} Amount in seconds
 */

// millis to seconds
export const millisToSeconds = (millis) => {
  return millis < 0 ? Math.ceil(millis / 1000) : Math.floor(millis / 1000);
};

/**
 * @description Converts milliseconds to seconds
 * @param {number} millis - time in seconds
 * @param {boolean} hideZero - wether to show hours in case its 00
 * @returns {number} Amount in seconds
 */

// millis to minutes
export const millisToMinutes = (millis) => {
  return millis < 0 ? Math.ceil(millis / 60000) : Math.floor(millis / 60000);
};

/**
 * @description Converts timestring  to milliseconds
 * @param {string} string - time string "23:00:12"
 * @returns {number} Amount in milliseconds
 */

// timeStringToMillis
export const timeStringToMillis = (string) => {
  if (typeof string !== 'string') return 0;
  const time = string.split(':');
  if (time.length === 2) return Math.abs(time[0]) * 3600000 + time[1];
  if (time.length === 3)
    return Math.abs(time[0]) * 3600000 + time[1] * 60000 + time[2] * 1000;
  else return 0;
};
