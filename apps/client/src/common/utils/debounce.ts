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

export function debounceWithValue(callback: (value: string) => void, wait: number) {
  let timeout: NodeJS.Timeout | null;
  return (value: string) => {
    if (timeout) {
      return;
    }
    timeout = setTimeout(() => {
      timeout = null;
      callback(value);
    }, wait);
  };
}
