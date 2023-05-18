/**
 * @description Cleans given url
 * @param {string} url - URL to be checked
 * @returns {string} Sanitized url
 */
export const cleanURL = (url) => {
  // trim whitespaces
  let r = url.trim();

  // clear any whitespaces
  r = r.split(' ').join('%20');

  // contain only allowed characters
  r = r.replace(/([@\s<>[\]{}|\\^])+/g, '');
  // starts with http://
  if (!r.startsWith('http://')) r = `http://${r}`;

  return r;
};
