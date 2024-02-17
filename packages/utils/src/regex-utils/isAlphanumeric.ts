/**
 * @description Validates a alphanumeric string
 * @returns {boolean}
 */
export const isAlphanumeric = (text: string): boolean => {
  const regex = /^[a-z0-9]+$/i;
  return regex.test(text);
};
