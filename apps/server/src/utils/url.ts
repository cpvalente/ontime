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
  sanitised = sanitised.replace(/%40/g, '@');
  sanitised = sanitised.replace(/%5B/g, '[');
  sanitised = sanitised.replace(/%5D/g, ']');
  sanitised = sanitised.replace(/%7B/g, '{');
  sanitised = sanitised.replace(/%7D/g, '}');
  sanitised = sanitised.replace(/%7C/g, '|');
  sanitised = sanitised.replace(/%5C/g, '\\');
  sanitised = sanitised.replace(/%5E/g, '^');
  sanitised = sanitised.replace(/%60/g, '`');
  sanitised = sanitised.replace(/%20/g, '+');

  // starts with http://
  if (!sanitised.startsWith('http://')) sanitised = `http://${sanitised}`;

  return sanitised;
};
