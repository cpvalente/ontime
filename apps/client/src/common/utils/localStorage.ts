import { baseURI } from '../../externals';

export function booleanFromLocalStorage(key: string, fallback: boolean): boolean {
  const valueInStorage = localStorage.getItem(key);
  if (valueInStorage) {
    return valueInStorage === 'true';
  } else {
    localStorage.setItem(key, String(fallback));
    return fallback;
  }
}

export function makeStageKey(key: string) {
  if (baseURI) return `${baseURI}-${key}`;
  return key;
}
