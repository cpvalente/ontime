export function isString(value: unknown): asserts value is string {
  if (typeof value !== 'string') {
    throw new Error(`Unexpected payload type: ${String(value)}`);
  }
}

export function isDefined<T>(value: T | undefined): asserts value is T {
  if (value === undefined) {
    throw new Error('Payload not found');
  }
}

export function isNumber(value: unknown): asserts value is number {
  if (typeof value !== 'number') {
    throw new Error(`Unexpected payload type: ${String(value)}`);
  }
}

export function isObject(value: unknown): asserts value is object {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`Unexpected payload type: ${String(value)}`);
  }
}

export function isArray(value: unknown): asserts value is unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`Unexpected payload type: ${String(value)}`);
  }
}

export function hasKeys<T extends object, K extends keyof any>(
  value: T,
  keys: K[],
): asserts value is T & Record<K, unknown> {
  for (const key of keys) {
    if (!(key in value)) {
      throw new Error(`Key not found: ${String(key)}`);
    }
  }
}
