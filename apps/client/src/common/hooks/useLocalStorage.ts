import { useSyncExternalStore } from 'react';

const STORAGE_EVENT = 'ontime-storage';

export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const localStorageValue = useSyncExternalStore(subscribe, () => getSnapshot(key));
  const parsedLocalStorageValue: T = localStorageValue ? JSON.parse(localStorageValue) : initialValue;

  /**
   * @description Set value to local storage
   * @param value
   */
  const setLocalStorageValue = (value: T | ((val: T) => T)) => {
    // Allow value to be a function so we have same API as useState
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
    console.error(error);
    return null;
  }
}
