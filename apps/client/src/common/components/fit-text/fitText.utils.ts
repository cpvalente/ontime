/**
 * @param low inclusive, must be true on predicate function
 * @param high exclusive,
 * @param predicate predicate function
 */
export const bsearch = (low: number, high: number, predicate: (mid: number) => boolean): number => {
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (mid === low) break;

    if (predicate(mid)) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return low;
};
