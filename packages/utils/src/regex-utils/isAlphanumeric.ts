/**
 * @description Validates a alphanumeric string
 * @returns {boolean}
 */
export const isAlphanumeric = (text: string): boolean => {
  const regex = /^[a-zA-Z0-9]+$/;
  return regex.test(text);
};
