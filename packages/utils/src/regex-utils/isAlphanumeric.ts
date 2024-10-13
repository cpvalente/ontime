/**
 * @description Validates a alphanumeric string
 * @returns {boolean}
 */
export const isAlphanumeric = (text: string): boolean => {
  const regex = /^[a-z0-9]+$/i;
  return regex.test(text);
};

/**
 * @description Validates a alphanumeric string allow space
 * @returns {boolean}
 */
export const isAlphanumericWithSpace = (text: string): boolean => {
  const regex = /^[a-z0-9_ ]+$/i;
  return regex.test(text);
};
