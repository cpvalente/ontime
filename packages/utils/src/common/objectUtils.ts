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

/**
 * Whether an object is empty
 */
export function isObjectEmpty(obj: object): boolean {
  return Object.keys(obj).length === 0;
}

/**
 * Removes a copy of the object without the properties which have undefined values
 */
export function withoutUndefinedValues<T extends Record<string, unknown>>(
  obj: T,
): { [K in keyof T]: Exclude<T[K], undefined> } {
  Object.keys(obj).forEach((key) => obj[key] === undefined && delete obj[key]);
  return obj as { [K in keyof T]: Exclude<T[K], undefined> };
}

/**
 * Checks whether a value is part of an enum
 */
export function isValueOfEnum<T extends object>(enumObj: T, value: unknown): value is T[keyof T] {
  return Object.values(enumObj).includes(value);
}
