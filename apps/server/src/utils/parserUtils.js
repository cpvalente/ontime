import fs from 'fs';

/**
 * @description Ensures variable is string, it skips object types
 * @param {any} val - variable to convert
 * @param {string} [fallback=''] - fallback value
 * @returns {string} - value as string or fallback if not possible
 */
export const makeString = (val, fallback = '') => {
  if (typeof val === 'string') return val;
  else if (val == null || val.constructor === Object) return fallback;
  return val.toString();
};

/**
 * @description validates a duration value against options
 * @param {number} timeStart
 * @param {number} timeEnd
 * @returns {number}
 */
export const validateDuration = (timeStart, timeEnd) => {
  // Durations must be positive
  return Math.max(timeEnd - timeStart, 0);
};

/**
 * @description Delete file from system
 * @param {string} file - reference to file
 */
export const deleteFile = async (file) => {
  // delete a file
  fs.unlink(file, (err) => {
    if (err) {
      console.log(err);
    }
  });
};

/**
 * @description Delete file from system
 * @param {string} file - reference to file
 * @returns {boolean} - whether file is valid JSON
 */
export const validateFile = (file) => {
  try {
    JSON.parse(fs.readFileSync(file, 'utf-8'));
    return true;
  } catch (err) {
    return false;
  }
};

/**
 * @description Verifies if object is empty
 * @param {object} obj
 */
export const isEmptyObject = (obj) => {
  if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
    return Object.keys(obj).length === 0;
  }
  throw new Error('Variable is not an object');
};

/**
 * @description Merges two objects, suppressing undefined keys
 * @param {object} a
 * @param {object} b
 */
export const mergeObject = (a, b) => {
  const merged = {};
  Object.keys({ ...a, ...b }).map((key) => {
    merged[key] = typeof b[key] === 'undefined' ? a[key] : b[key];
  });
  return merged;
};

/**
 * @description Removes undefined
 * @param {object} obj
 */
export const removeUndefined = (obj) => {
  const patched = {};
  Object.keys({ ...obj })
    .filter((key) => typeof obj[key] !== 'undefined')
    .map((key) => (patched[key] = obj[key]));
  return patched;
};
