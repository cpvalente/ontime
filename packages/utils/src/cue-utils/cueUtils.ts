import { OntimeEvent, OntimeRundown } from 'ontime-types';

import { getFirstEvent, getNextEvent } from '../rundown-utils/rundownUtils.js';

/**
 * Finds if last characters in input are a number and increments
 * @param input {string}
 */
export function getIncrement(input: string): string {
  // Check if the input string contains a number at the end
  const match = input.match(/^(\D*)(\d+)(\.\d+)?$/);

  if (match) {
    // If a number is found, extract the non-numeric prefix, integer part, and decimal part
    let [, prefix, integerPart, decimalPart] = match;

    if (decimalPart) {
      if (decimalPart === '.99') {
        decimalPart = '.100';
      } else {
        const addDecimal = '0'.repeat(decimalPart.length - 2) + '1';
        const incrementedDecimal = (Number(decimalPart) + Number('0.' + addDecimal)).toFixed(decimalPart.length - 1);
        decimalPart = incrementedDecimal.toString().replace('0.', '.');
      }
      return `${prefix}${integerPart}${decimalPart}`;
    }
    const incrementedInteger = Number(integerPart) + 1;
    integerPart = incrementedInteger.toString();
    return `${prefix}${integerPart}`;
  }
  // If no number is found, append "2" to the string and return the updated string
  return input + '2';
}

/**
 * Gets suitable name for a new event cue
 * @param rundown {OntimeRundown}
 * @param insertAfterId {string}
 */
export function getCueCandidate(rundown: OntimeRundown, insertAfterId?: string): string {
  if (typeof insertAfterId === 'undefined' || rundown.length === 0) {
    const firstEvent = getFirstEvent(rundown);
    if (firstEvent === null) {
      return '1';
    }
    return firstEvent.cue === '1' ? '0.1' : '1';
  }

  const afterIndex = rundown.findIndex((event) => event.id === insertAfterId);
  if (afterIndex === -1) {
    const firstEvent = getFirstEvent(rundown);
    if (firstEvent === null) {
      return '1';
    }
    return firstEvent.cue === '1' ? '0.1' : '1';
  }
  const previousEvent = rundown.find((event) => event.id === insertAfterId);
  const nextEvent = getNextEvent(rundown, insertAfterId);

  if (previousEvent == null) {
    if (nextEvent == null) {
      return '1';
    }
    return nextEvent.cue === '1' ? '0.1' : '1';
  }

  let cue = getIncrement((previousEvent as OntimeEvent).cue);
  if (cue === nextEvent?.cue) {
    cue = (previousEvent as OntimeEvent).cue + '.1';
  }

  return cue;
}

export function sanitiseCue(cue: string) {
  return cue.replaceAll(' ', '').replaceAll(',', '.');
}
