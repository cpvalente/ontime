import { stringify } from 'csv-stringify/browser/esm/sync';
import { OntimeEntry, ProjectRundowns } from 'ontime-types';

/**
 * Converts an array of arrays to a CSV file
 */
export function makeCSVFromArrayOfArrays(arrayOfArrays: string[][]): string {
  return stringify(arrayOfArrays);
}

/**
 * Receives an object of rundowns, and flattens them into a single, linear rundown
 * Used for CSV export
 */
export function aggregateRundowns(rundowns: ProjectRundowns): OntimeEntry[] {
  const rundownKeys = Object.keys(rundowns);
  if (rundownKeys.length === 0) return [];
  const flatRundown: OntimeEntry[] = [];

  for (const key of rundownKeys) {
    const { order, entries } = rundowns[key];

    for (let i = 0; i < order.length; i++) {
      const entryId = order[i];
      const entry = entries[entryId];

      flatRundown.push(entry);
    }
  }
  return flatRundown;
}
