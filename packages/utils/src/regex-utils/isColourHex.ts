/**
 * @description Validates a colour hex string
 * @param {string} text - colour hex string "#FFF" | "#FFFF" | "#FFFFFF" | "#FFFFFFFF"
 * @returns {boolean} string represents time
 */
export const isColourHex = (text: string): boolean => {
  const regexS = /^#((?:[a-f\d]{1}){3,4})$/i;
  const regexD = /^#((?:[a-f\d]{2}){3,4})$/i;
  return regexS.test(text) || regexD.test(text);
};
