import { stringify } from 'csv-stringify/browser/esm/sync';

/**
 * Converts an array of arrays to a CSV file
 */
export function makeCSVFromArrayOfArrays(arrayOfArrays: string[][]): string {
  return stringify(arrayOfArrays);
}
