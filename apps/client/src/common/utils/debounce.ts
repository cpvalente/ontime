export function debounce(callback: () => void, wait: number) {
  let timeout: NodeJS.Timeout | null;
  return () => {
    if (timeout) {
      return;
    }
    timeout = setTimeout(() => {
      timeout = null;
      callback();
    }, wait);
  };
}
