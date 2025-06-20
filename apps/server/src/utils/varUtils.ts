export function isObject(variable: unknown): boolean {
  return typeof variable === 'object' && variable !== null && !Array.isArray(variable);
}
