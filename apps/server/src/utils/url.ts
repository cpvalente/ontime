/**
 * @description Cleans given url
 * @param {string} url - URL to be checked
 * @returns {string} Sanitized url
 */
export const cleanURL = (url: string): string => {
  // trim whitespaces
  let sanitised = url.trim();

  // clear any whitespaces
  sanitised = sanitised.split(' ').join('%20');

  // contain only allowed characters
  sanitised = sanitised.replace(/([@\s<>[\]{}|\\^])+/g, '');

  // starts with http://
  if (!sanitised.startsWith('http://')) sanitised = `http://${sanitised}`;

  return sanitised;
};
