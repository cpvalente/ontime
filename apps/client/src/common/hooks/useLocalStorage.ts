import { useSyncExternalStore } from 'react';

const STORAGE_EVENT = 'onetime-storage';

export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const localStorageValue = useSyncExternalStore(subscribe, () => getSnapshot(key));
  const parsedLocalStorageValue = localStorageValue ? JSON.parse(localStorageValue) : initialValue;

  const setLocalStorageValue = (value: T | ((val: T) => T)) => {
    const valueToStore = value instanceof Function ? value(parsedLocalStorageValue) : value;
    localStorage.setItem(`ontime-${key}`, JSON.stringify(valueToStore));

    window.dispatchEvent(new StorageEvent(STORAGE_EVENT));
  };

  return [parsedLocalStorageValue, setLocalStorageValue] as const;
};

function subscribe(callback: () => void) {
  window.addEventListener(STORAGE_EVENT, callback);

  return () => {
    window.removeEventListener(STORAGE_EVENT, callback);
  };
}

function getSnapshot(key: string): string | null {
  try {
    return window.localStorage.getItem(`ontime-${key}`);
  } catch (error) {
    return null;
  }
}
