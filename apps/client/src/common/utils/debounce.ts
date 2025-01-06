export function debounce<T extends any[]>(callback: (...args: T) => void, wait: number) {
  let timeout: NodeJS.Timeout | null;
  return (...args: T) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      timeout = null;
      callback(...args);
    }, wait);
  };
}
