export const timeFormat = 'HH:mm';
export const timeFormatSeconds = 'HH:mm:ss';

const mts = 1000; // millis to seconds
const mtm = 1000 * 60; // millis to minutes
const mth = 1000 * 60 * 60; // millis to hours
const mtd = 1000 * 60 * 60 * 24; // millis to days

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
  const hours = showWith0(Math.floor(((ms / mth) % 60) % 24));
  const minutes = showWith0(Math.floor((ms / mtm) % 60));
  const seconds = showWith0(Math.floor((ms / mts) % 60));

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
 * @param {boolean} [hideZero] - whether to show hours in case its 00
 * @returns {string} String representing absolute time 00:12:02
 */

export function formatDisplay(seconds, hideZero=false) {
  // add an extra 0 if necessary
  const format = (val) => `0${Math.floor(val)}`.slice(-2);

  const s = Math.abs(seconds);
  const hours = Math.floor((s / 3600) % 24);
  const minutes = Math.floor((s % 3600) / 60);

  if (hideZero && hours < 1) return [minutes, s % 60].map(format).join(':');
  else return [hours, minutes, s % 60].map(format).join(':');
}

/**
 * @description Converts milliseconds to seconds
 * @param {number} millis - time in seconds
 * @returns {number} Amount in seconds
 */

// millis to seconds
export const millisToSeconds = (millis) => {
  return millis < 0 ? Math.ceil(millis / mts) : Math.floor(millis / mts);
};

/**
 * @description Converts milliseconds to seconds
 * @param {number} millis - time in seconds
 * @returns {number} Amount in seconds
 */

// millis to minutes
export const millisToMinutes = (millis) => {
  return millis < 0 ? Math.ceil(millis / mtm) : Math.floor(millis / mtm);
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
  if (time.length === 1) return Math.abs(time[0] * mts);
  if (time.length === 2) return Math.abs(time[0]) * mtm + time[1] * mts;
  if (time.length === 3)
    return Math.abs(time[0]) * mth + time[1] * mtm + time[2] * mts;
  else return 0;
};

/**
 * @description Validates a time string
 * @param {string} string - time string "23:00:12"
 * @returns {boolean} string represents time
 */

// isTimeString
export const isTimeString = (string) => {
  // ^                   # Start of string
  // (?:                 # Try to match...
  //  (?:                #  Try to match...
  //   ([01]?\d|2[0-3]): #   HH:
  //  )?                 #  (optionally).
  //  ([0-5]?\d):        #  MM: (required)
  // )?                  # (entire group optional, so either HH:MM:, MM: or nothing)
  // ([0-5]?\d)          # SS (required)
  // $                   # End of string

  const regex = /^(?:(?:([01]?\d|2[0-3]):)?([0-5]?\d):)?([0-5]?\d)$/;
  return regex.test(string);
};
