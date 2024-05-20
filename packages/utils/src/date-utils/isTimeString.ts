/**
 * @description Validates a time string
 */
export function isTimeString(text: string): boolean {
  const regex = /^(?:(?:([01]?\d|2[0-3])[:,.])?([0-5]?\d)[:,.])?([0-5]?\d)?(\s)?([APap][Mm])?$/;
  return regex.test(text);
}

/**
 * @description Validates a ISO8601 date-time string
 */
export function isISO8601(text: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
  return regex.test(text);
}
