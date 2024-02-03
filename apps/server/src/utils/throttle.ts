/**
 * Creates a throttled version of the passed function
 * This function uses a leading algorithm
 * which means that the function will be executed immediately on first call
 * @param {Function} cb - function to throttle
 * @param {number} delay - time (in ms) to throttle
 * @returns {Function}
 */
export function throttle<T extends any[], U>(cb: (...args: T) => U, delay: number) {
  let shouldWait = false;
  let waitingArgs: T | null = null;
  const timeoutFunc = () => {
    if (waitingArgs == null) {
      shouldWait = false;
    } else {
      cb(...waitingArgs);
      waitingArgs = null;
      setTimeout(timeoutFunc, delay);
    }
  };

  return (...args: T) => {
    if (shouldWait) {
      waitingArgs = args;
      return;
    }

    cb(...args);
    shouldWait = true;
    setTimeout(timeoutFunc, delay);
  };
}
