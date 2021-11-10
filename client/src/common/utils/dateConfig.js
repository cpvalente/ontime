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

// another go at simpler string formatting (counters)
export function formatDisplay(seconds, hideZero) {
  const format = (val) => `0${Math.floor(val)}`.slice(-2);
  const hours = seconds / 3600;
  const minutes = (seconds % 3600) / 60;

  if (hideZero && hours < 1)
    return [minutes, seconds % 60].map(format).join(':');
  else return [hours, minutes, seconds % 60].map(format).join(':');
}

// millis to seconds
export const millisToSeconds = (millis) => {
  return Math.floor(millis / 1000);
};

// millis to minutes
export const millisToMinutes = (millis) => {
  return Math.floor(millis / 60000);
};

// timeStringToMillis
export const timeStringToMillis = (string) => {
  let time = string.split(':');
  return time[0] * 3600000 + time[1] * 60000;
};
