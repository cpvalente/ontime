export const timeFormat = 'HH:mm';
export const timeFormatSeconds = 'HH:mm:ss';

const mts = 1000; // millis to seconds
const mtm = 1000 * 60; // millis to minutes
const mth = 1000 * 60 * 60; // millis to hours

/**
 * another go at simpler string formatting (counters)
 * @description Converts seconds to string representing time
 * @param {number} seconds - time in seconds
 * @param {boolean} [hideZero] - whether to show hours in case its 00
 * @returns {string} String representing absolute time 00:12:02
 */
export function formatDisplay(seconds, hideZero = false) {
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
export const millisToSeconds = (millis) => {
  return millis < 0 ? Math.ceil(millis / mts) : Math.floor(millis / mts);
};

/**
 * @description Converts milliseconds to seconds
 * @param {number} millis - time in seconds
 * @returns {number} Amount in seconds
 */
export const millisToMinutes = (millis) => {
  return millis < 0 ? Math.ceil(millis / mtm) : Math.floor(millis / mtm);
};

/**
 * @description Converts timestring to milliseconds
 * @param {string} string - time string "23:00:12"
 * @returns {number} Amount in milliseconds
 */
export const timeStringToMillis = (string) => {
  if (typeof string !== 'string') return 0;
  const time = string.split(':');
  if (time.length === 1) return Math.abs(time[0] * mts);
  if (time.length === 2) return Math.abs(time[0]) * mtm + time[1] * mts;
  if (time.length === 3) return Math.abs(time[0]) * mth + time[1] * mtm + time[2] * mts;
  else return 0;
};

/**
 * @description Validates a time string
 * @param {string} string - time string "23:00:12"
 * @returns {boolean} string represents time
 */
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

  const regex = /^(?:(?:([01]?\d|2[0-3])[:,.])?([0-5]?\d)[:,.])?([0-5]?\d)$/;
  return regex.test(string);
};

const parse = (valueAsString) => {
  const parsed = parseInt(valueAsString, 10);
  if (isNaN(parsed)) {
    return 0;
  }
  return Math.abs(parsed);
};

/**
 * @description Parses a time string to millis
 * @param string - time string
 * @returns {number} - time string in millis
 */
export const timeHelper = (string) => {
  let millis = 0;


  // split string at known separators    : , .
  const separatorRegex = /[\s,:.]+/;
  const [first, second, third] = string.split(separatorRegex);

  if (first != null && second != null && third != null) {
    // if string has three sections, treat as [hours] [minutes] [seconds]
    millis = parse(first) * mth;
    millis += parse(second) * mtm;
    millis += parse(third) * mts;
  } else if (third == null) {
    // if string has two sections, treat as [minutes] [seconds]
    millis = parse(first) * mtm;
    millis += parse(second) * mts;
  } else if (second == null) {
    // if string has one section, treat as [minutes]
    millis = parse(first) * mtm;
  }
  return millis;
};
