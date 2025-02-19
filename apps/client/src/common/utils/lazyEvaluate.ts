/**
 * Allows lazy evaluation and caching of a functions result
 */
export function lazyEvaluate<T>(fn: () => T): () => T {
  let result: T | undefined;
  return function () {
    if (result === undefined) {
      result = fn();
    }
    return result;
  };
}
