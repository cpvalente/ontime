export function booleanFromLocalStorage(key: string, fallback: boolean): boolean {
  const valueInStorage = localStorage.getItem(key);
  if (valueInStorage) {
    return valueInStorage === 'true';
  } else {
    localStorage.setItem(key, String(fallback));
    return fallback;
  }
}

export function numberFromLocalStorage(key: string, fallback: number): number {
  const valueInStorage = localStorage.getItem(key);
  if (valueInStorage === null) {
    localStorage.setItem(key, String(fallback));
    return fallback;
  }
  const maybeNumber = Number(valueInStorage);
  if (isNaN(maybeNumber)) {
    localStorage.setItem(key, String(fallback));
    return fallback;
  }
  return maybeNumber;
}
