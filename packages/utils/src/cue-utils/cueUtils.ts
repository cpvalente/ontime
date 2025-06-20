import type { EntryId, OntimeEntry, RundownEntries } from 'ontime-types';
import { isOntimeEvent } from 'ontime-types';

import { getFirstEventNormal, getNextEventNormal, getPreviousEventNormal } from '../rundown-utils/rundownUtils.js';
import { isNumeric } from '../types/types.js';

// Zero or more non-digit characters at the beginning ((\D*)).
// One or more digits ((\d+)).
// Optionally, a decimal part starting with a dot ((\.\d+)?).
const regex = /^(\D*)(\d+)(\.\d+)?$/;

/**
 * Finds if last characters in input are a number and increments
 */
export function getIncrement(input: string): string {
  // Check if the input string contains a number at the end
  const match = regex.exec(input);
  if (match) {
    // If a number is found, extract the non-numeric prefix, integer part, and decimal part
    // eslint-disable-next-line prefer-const -- some items in the destructuring are modified
    let [, prefix, integerPart, decimalPart] = match;

    if (decimalPart) {
      if (decimalPart === '.99') {
        decimalPart = '.100';
      } else {
        const addDecimal = `${'0'.repeat(decimalPart.length - 2)}1`;
        const incrementedDecimal = (Number(decimalPart) + Number(`0.${addDecimal}`)).toFixed(decimalPart.length - 1);
        decimalPart = incrementedDecimal.toString().replace('0.', '.');
      }
      return `${prefix}${integerPart}${decimalPart}`;
    }
    const incrementedInteger = Number(integerPart) + 1;
    integerPart = incrementedInteger.toString();
    return `${prefix}${integerPart}`;
  }
  // If no number is found, append "2" to the string and return the updated string
  return `${input}2`;
}

/**
 * Gets suitable name for a new event cue
 */
export function getCueCandidate(entries: RundownEntries, order: EntryId[], insertAfterId?: string): string {
  // we did not provide a element to go after, we attempt to go first so only need to check for a cue with value 1
  if (insertAfterId === undefined || order.length === 0) {
    return addAtTop();
  }

  // get the given event, or any before that
  let previousEvent: OntimeEntry | null | undefined = entries[insertAfterId];

  if (!isOntimeEvent(previousEvent)) {
    previousEvent = getPreviousEventNormal(entries, order, insertAfterId).previousEvent;
    if (!isOntimeEvent(previousEvent)) {
      return addAtTop();
    }
  }

  // the cue is based on the previous event cue
  const cue = getIncrement(previousEvent.cue);
  const { nextEvent } = getNextEventNormal(entries, order, insertAfterId);

  // if increment is clashing with next, we add a decimal instead
  if (cue !== nextEvent?.cue) {
    return cue;
  }

  // there is a clash, bt the cue is a pure number
  if (isNumeric(cue)) {
    return incrementDecimal(previousEvent.cue);
  }

  /**
   * at this point, we know the cue is not numeric
   * but the increment failed, so we have a numeric ending
   * eg. Presenter 1   .... Presenter 2   -> Presenter1.1
   * eg. Presenter 1.1 .... Presenter 1.2 -> Presenter1.1.1
   */
  return `${previousEvent.cue}.1`;

  function incrementDecimal(cue: string) {
    const n = Number(cue);
    return (n + 0.1).toString();
  }

  function addAtTop() {
    const firstEventCue = getFirstEventNormal(entries, order).firstEvent?.cue;
    if (firstEventCue === '1') {
      return '0.1';
    }
    return '1';
  }
}

export function sanitiseCue(cue: string) {
  return cue.replaceAll(' ', '').replaceAll(',', '.');
}
