import { is } from './is.js';

export function isString(value: unknown): asserts value is string {
  if (!is.string(value)) {
    throw new Error(`Unexpected payload type: ${String(value)}`);
  }
}

export function isDefined<T>(value: T | undefined): asserts value is T {
  if (!is.defined(value)) {
    throw new Error('Payload not found');
  }
}

export function isNumber(value: unknown): asserts value is number {
  if (!is.number(value)) {
    throw new Error(`Unexpected payload type: ${String(value)}`);
  }
}

export function isObject(value: unknown): asserts value is object {
  if (!is.object(value)) {
    throw new Error(`Unexpected payload type: ${String(value)}`);
  }
}

export function isArray(value: unknown): asserts value is unknown[] {
  if (!is.array(value)) {
    throw new Error(`Unexpected payload type: ${String(value)}`);
  }
}

export function hasKeys<T extends object, K extends keyof any>(
  value: T,
  keys: K[],
): asserts value is T & Record<K, unknown> {
  if (!is.objectWithKeys(value, keys)) {
    throw new Error(`Unexpected payload type: ${String(value)}`);
  }
}
