import { stringify } from 'csv-stringify/browser/esm/sync';

/**
 * @description Converts an array of arrays to a CSV file
 * @param {string[][]} arrayOfArrays
 * @return {string}
 */
export function makeCSVFromArrayOfArrays(arrayOfArrays: string[][]): string {
  return stringify(arrayOfArrays);
}
