/**
 * Extracts a value from a nested object using a dot-separated path
 */
export function getPropertyFromPath<T extends object>(path: string, obj: T): unknown | undefined {
  const keys = path.split('.');
  let result: any = obj;

  // iterate through variable parts, and look for the property in the given object
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key];
    } else {
      return undefined;
    }
  }

  return result;
}

export function isObjectEmpty(obj: object): boolean {
  return Object.keys(obj).length === 0;
}
