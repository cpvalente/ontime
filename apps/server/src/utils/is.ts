export const is = {
  string: (value: unknown): value is string => typeof value === 'string',
  number: (value: unknown): value is number => typeof value === 'number',
  defined: <T>(value: T | undefined): value is T => value !== undefined,
  object: (value: unknown): value is object => typeof value === 'object' && value !== null && !Array.isArray(value),
  objectWithKeys: <T extends object, K extends keyof any>(value: T, keys: K[]): value is T & Record<K, unknown> => {
    return keys.every((key) => key in value);
  },
  array: (value: unknown): value is unknown[] => Array.isArray(value),
};
