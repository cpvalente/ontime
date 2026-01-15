import type { EntryId, OntimeEntry, RundownEntries } from 'ontime-types';
import { isOntimeEvent } from 'ontime-types';

import { getFirstEventNormal, getNextEventNormal, getPreviousEventNormal } from '../rundown-utils/rundownUtils.js';

/**
 * Increments a decimal value or returns false if the result should be carried up
 * @param decimal
 * @returns
 */
function incrementDecimal(decimal: string): string | false {
  if (!decimal) return false;
  let actualPart = decimal;
  while (actualPart.startsWith('0') && actualPart.length > 1) {
    actualPart = actualPart.slice(1);
  }
  const incrementedString = (parseInt(actualPart) + 1).toString();
  if (incrementedString.length > decimal.length) return false;
  return incrementedString.padStart(decimal.length, '0');
}

// Zero or more non-digit characters at the beginning ((\D*)).
// One or more digits ((\d+)).
// Optionally, a decimal part starting with a dot ((\.\d+)?).
const regex = /^(\D*)(\d+)(\.)?(\d+)?$/;

/**
 * Finds if last characters in input are a number and increments
 */
export function getIncrement(input: string, next?: string): string {
  // Check if the input string contains a number at the end
  const match = regex.exec(input);
  const matchNext = next ? regex.exec(next) : null;

  if (match) {
    // If a number is found, extract the non-numeric prefix, integer part, and decimal part
    const [, prefix, integerPart, _dot, decimalPart] = match;

    if (matchNext) {
      const [, prefix_next, integerPart_next, _dot, decimalPart_next] = matchNext;
      //   //   const floatPart_ext = parseFloat(integerPart_next + '.' + decimalPart_next);
      if (prefix === prefix_next) {
        const parsedIntPart = parseInt(integerPart);
        const parsedNextIntPart = parseInt(integerPart_next);
        if (parsedIntPart <= parsedNextIntPart - 2) return `${prefix}${parsedIntPart + 1}`;
        if (parsedIntPart <= parsedNextIntPart) {
          if (!decimalPart_next) {
            const maybeDecimal = incrementDecimal(decimalPart);
            if (maybeDecimal) return `${prefix}${integerPart}.${maybeDecimal}`;
            return `${prefix}${integerPart}.${(decimalPart ?? '') + '1'}`; // no good way to solve this so add a 1
          }
          if (!decimalPart) return `${prefix}${parsedIntPart + 1}`;
        }
      }
    }

    const maybeDecimal = incrementDecimal(decimalPart);
    if (maybeDecimal === false) return `${prefix}${parseInt(integerPart) + 1}`;
    return `${prefix}${integerPart}.${maybeDecimal}`;
  }
  // If no number is found, append "2" to the string and return the updated string
  return `${input}2`;
}

/**
 * Gets suitable name for a new event cue
 */
export function getCueCandidate(entries: RundownEntries, order: EntryId[], insertAfterId: EntryId | null): string {
  // we did not provide a element to go after, we attempt to go first so only need to check for a cue with value 1
  if (insertAfterId === null || order.length === 0) {
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
  const { nextEvent } = getNextEventNormal(entries, order, insertAfterId);

  // the cue is based on the previous event cue
  const cue = getIncrement(previousEvent.cue, nextEvent?.cue);
  return cue;

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
