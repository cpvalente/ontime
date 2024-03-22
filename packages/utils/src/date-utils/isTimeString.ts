/**
 * @description Validates a time string
 * @param {string} text - time string "23:00:12"
 * @returns {boolean} string represents time
 */
export const isTimeString = (text: string): boolean => {
  const regex = /^(?:(?:([01]?\d|2[0-3])[:,.])?([0-5]?\d)[:,.])?([0-5]?\d)?(\s)?([APap][Mm])?$/;
  return regex.test(text);
};
