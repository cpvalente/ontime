/**
 * Business logic for resolving a string
 */
export function extractPin(value: string | undefined | null, fallback: string | null): string | null {
  if (value === null) {
    return value;
  }
  if (typeof value === 'undefined') {
    return fallback;
  }
  if (value.length === 0) {
    return null;
  }
  return value;
}
