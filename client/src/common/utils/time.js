import { DateTime } from 'luxon';

const mts = 1000; // millis to seconds
const mtm = 1000 * 60; // millis to minutes
const mth = 1000 * 60 * 60; // millis to hours

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
 * @description Converts milliseconds to string representing time
 * @param {number} ms - time in milliseconds
 * @param {boolean} showSeconds - weather to show the seconds
 * @param {string} delim - character between HH MM SS
 * @param {string} ifNull - what to return if value is null
 * @returns {string} String representing time 00:12:02
 */
export const stringFromMillis = (ms, showSeconds = true, delim = ':', ifNull = '...') => {
  if (ms == null || isNaN(ms)) return ifNull;
  const isNegative = ms < 0 ? '-' : '';
  const millis = Math.abs(ms);

  /**
   * @description ensures value is double digit
   * @param value
   * @return {string|*}
   */
  const showWith0 = (value) => (value < 10 ? `0${value}` : value);
  const hours = showWith0(Math.floor(((millis / mth) % 60) % 24));
  const minutes = showWith0(Math.floor((millis / mtm) % 60));
  const seconds = showWith0(Math.floor((millis / mts) % 60));

  return showSeconds
    ? `${isNegative}${
        parseInt(hours, 10) ? `${hours}${delim}` : `00${delim}`
      }${minutes}${delim}${seconds}`
    : `${isNegative}${parseInt(hours, 10) ? `${hours}` : '00'}${delim}${minutes}`;
};

/**
 * @description utility function to format a date in 12 or 24 hour format
 * @param {number} milliseconds
 * @param {boolean} [to12h]
 * @param {object} [options]
 * @param {boolean} [options.showSeconds]
 * @param {string} [options.format]
 * @return {string}
 */
export const formatTime = (milliseconds, to12h = false, options) => {
  if (milliseconds === null) {
    return '...';
  }
  const { showSeconds = false, format: formatString = 'hh:mm a' } = options || {};
  return to12h
    ? DateTime.fromMillis(milliseconds).toUTC().toFormat(formatString)
    : stringFromMillis(milliseconds, showSeconds);
};
