import type { OntimeEvent, OntimeRundown, OntimeRundownEntry } from 'ontime-types';
import { isOntimeEvent } from 'ontime-types';

import { getFirstEvent, getNextEvent, getPreviousEvent } from '../rundown-utils/rundownUtils.js';
import { isNumeric } from '../types/types.js';

// Zero or more non-digit characters at the beginning ((\D*)).
// One or more digits ((\d+)).
// Optionally, a decimal part starting with a dot ((\.\d+)?).
const regex = /^(\D*)(\d+)(\.\d+)?$/;

/**
 * Finds if last characters in input are a number and increments
 * @param input {string}
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
 * @param rundown {OntimeRundown}
 * @param insertAfterId {string}
 */
export function getCueCandidate(rundown: OntimeRundown, insertAfterId?: string): string {
  function addAtTop() {
    const firstEventCue = getFirstEvent(rundown).firstEvent?.cue;

    if (isNumeric(firstEventCue)) {
      return (Number(firstEventCue) / 10).toString();
    }
    return '1';
  }

  // we did not provide a element to go after, we attempt to go first so only need to check for a cue with value 1
  if (typeof insertAfterId === 'undefined' || rundown.length === 0) {
    return addAtTop();
  }

  const afterIndex = rundown.findIndex((event) => event.id === insertAfterId);

  // we did not find the previous element, insert at top
  if (afterIndex === -1) {
    return addAtTop();
  }

  // get elements around
  let previousEvent: OntimeRundownEntry | undefined | null | OntimeEvent = rundown.at(afterIndex);
  if (!isOntimeEvent(previousEvent)) {
    previousEvent = getPreviousEvent(rundown, insertAfterId).previousEvent as null | OntimeEvent;
  }

  let cue = '1';
  const { nextEvent } = getNextEvent(rundown, insertAfterId);

  // try and increment the cue
  if (isOntimeEvent(previousEvent)) {
    cue = getIncrement(previousEvent.cue);
  }

  // if increment is clashing with next, we add a decimal instead
  if (cue === nextEvent?.cue) {
    if (previousEvent === null) {
      cue = '0.1';
    } else {
      cue = `${previousEvent.cue}.1`;
    }
  }

  return cue;
}

export function sanitiseCue(cue: string = '') {
  return cue.replaceAll(' ', '').replaceAll(',', '.');
}
