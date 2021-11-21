const mts = 1000; // millis to seconds
const mtm = 1000 * 60; // millis to minutes
const mth = 1000 * 60 * 60; // millis to hours

/**
 * @description Converts milliseconds to string representing time
 * @param {number} ms - time in milliseconds
 * @param {boolean} showSeconds - wether to show the seconds
 * @param {string} delim - character between HH MM SS
 * @param {string} ifNull - what to return if value is null
 * @returns {string} String representing time 00:12:02
 */

export const stringFromMillis = (
  ms,
  showSeconds = true,
  delim = ':',
  ifNull = '...'
) => {
  if (ms === null || isNaN(ms)) return ifNull;
  const isNegative = ms < 0 ? '-' : '';
  const millis = Math.abs(ms);

  const showWith0 = (value) => (value < 10 ? `0${value}` : value);
  const hours = showWith0(Math.floor(((millis / mth) % 60) % 24));
  const minutes = showWith0(Math.floor((millis / mtm) % 60));
  const seconds = showWith0(Math.floor((millis / mts) % 60));

  return showSeconds
    ? `${isNegative}${
        parseInt(hours) ? `${hours}${delim}` : `00${delim}`
      }${minutes}${delim}${seconds}`
    : `${isNegative}${parseInt(hours) ? `${hours}` : '00'}${delim}${minutes}`;
};

/**
 * @description Converts an excel UTC date to milliseconds
 * @argument {string} excelDate - excel string date
 * @returns {number} - time in millisenconds
 */
export const excelDateStringToMillis = (excelDate) => {
  const date = new Date(excelDate);

  if (date instanceof Date && !isNaN(date)) {
    const h = date.getUTCHours();
    const m = date.getUTCMinutes();
    const s = date.getUTCSeconds();

    return h * mth + m * mtm + s * mts;
  }
  return null;
};
