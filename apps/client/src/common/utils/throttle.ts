export function throttle<T extends any[]>(callback: (...args: T) => void, wait: number) {
  let timeout: NodeJS.Timeout | null;
  return (...args: T) => {
    if (timeout) {
      return;
    }
    timeout = setTimeout(() => {
      timeout = null;
      callback(...args);
    }, wait);
  };
}
