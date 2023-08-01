import { OntimeEvent, OntimeRundownEntry } from 'ontime-types';

/**
 * Gets first event in rundown, if it exists
 * @param {OntimeRundownEntry[]} rundown
 * @return {OntimeEvent | null}
 */
export function getFirstEvent(rundown: OntimeRundownEntry[]) {
  return rundown.length ? rundown[0] : null;
}

/**
 * Gets next event in rundown, if it exists
 * @param {OntimeRundownEntry[]} rundown
 * @param {string} currentId
 * @return {OntimeEvent | null}
 */
export function getNextEvent(rundown: OntimeRundownEntry[], currentId: string) {
  const index = rundown.findIndex((event) => event.id === currentId);
  if (index !== -1 && index + 1 < rundown.length) {
    return rundown[index + 1];
  } else {
    return null;
  }
}

/**
 * Gets previous event in rundown, if it exists
 * @param {OntimeRundownEntry[]} rundown
 * @param {string} currentId
 * @return {OntimeEvent | null}
 */
export function getPreviousEvent(rundown: OntimeRundownEntry[], currentId: string) {
  const index = rundown.findIndex((event) => event.id === currentId);
  if (index !== -1 && index - 1 >= 0) {
    return rundown[index - 1];
  } else {
    return null;
  }
}
