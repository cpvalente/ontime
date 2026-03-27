import type { EntryId, OntimeEntry, RundownEntries } from 'ontime-types';
import { isOntimeEvent } from 'ontime-types';

import { getPreviousEventNormal } from '../rundown-utils/rundownUtils.js';

// Groups: 1=prefix, 2=separator(optional dash or space), 3=integer, 4='.', 5=fraction
const regex = /^(\D*?)(?:([ -]))?(\d+)(?:(\.)(\d+))?$/;

/**
 * Finds if last characters in input are a number and increments
 */
export function getIncrement(input: string): string {
  // Check if the input string contains a number at the end
  const match = regex.exec(input);
  if (match === null) return `${input}-2`;
  const [, prefix, separator, integerPart, _decimalSeparator, decimalPart] = match;
  if (decimalPart === undefined) return incrementInteger(prefix, integerPart, separator);
  return incrementDecimal(prefix, integerPart, decimalPart, separator);
}

const incrementDecimal = (prefix: string, integerPart: string, decimalPart: string, separator = '') => {
  const decimalInteger = parseInt(decimalPart);
  const incrementedDecimal = (decimalInteger + 1).toString();
  const newDecimalPart = incrementedDecimal.padStart(decimalPart.length, '0');
  return `${prefix}${separator ?? ''}${integerPart}.${newDecimalPart}`;
};

const incrementInteger = (prefix: string, integerPart: string, separator = '') => {
  const incrementedInteger = parseInt(integerPart) + 1;
  const newIntegerPart = incrementedInteger.toString();
  return `${prefix}${separator}${newIntegerPart}`;
};

/**
 * Gets suitable name for a new event cue
 */
export function getCueCandidate(entries: RundownEntries, order: EntryId[], insertAfterId: EntryId | null): string {
  if (order.length === 0 || insertAfterId === null) return '1';

  let previousEvent: OntimeEntry | null | undefined = entries[insertAfterId];

  if (!isOntimeEvent(previousEvent)) {
    previousEvent = getPreviousEventNormal(entries, order, insertAfterId).previousEvent;
    if (!isOntimeEvent(previousEvent)) return '1';
  }

  return getIncrement(previousEvent.cue);
}
