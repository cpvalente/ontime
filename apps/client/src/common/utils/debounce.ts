export function debounce(callback: (...args) => void, wait: number) {
  let timeout: NodeJS.Timeout | null;
  return (...args) => {
    if (timeout) {
      return;
    }
    timeout = setTimeout(() => {
      timeout = null;
      callback(...args);
    }, wait);
  };
}
