/**
 * Clamps a value between a min and a max
 * @param {number} num - Value to clamp
 * @param {number} min - min value
 * @param {number} max - max value
 * @returns {number}
 */
export const clamp = (num, min, max) =>
  Math.max(Math.min(num, Math.max(min, max)), Math.min(min, max));
