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

type CueNameMethod = 'number' | 'letter';

export function renumberEntries(
  entries: RundownEntries,
  order: EntryId[],
  from: EntryId,
  to: EntryId,
  increment: undefined | number,
  start: undefined | string,
) {
  let foundFrom = false;
  let foundTo = false;
  let currentCue = '';
  let cueNameMethod: CueNameMethod = 'number';
  for (const id of order) {
    const entry = entries[id];
    if (!isOntimeEvent(entry)) continue;
    if (!foundFrom && id === from) {
      foundFrom = true;
      currentCue = start === undefined ? entry.cue : start;
      increment = increment === undefined ? 1 : increment;
      if (isNumeric(currentCue)) {
        cueNameMethod = 'number';
        continue;
      }
      cueNameMethod = 'letter';
      continue;
    }

    switch (cueNameMethod) {
      case 'number': {
        // we cant do simple floating point as will will quickly hit precision errors
        let newCue = (Number(currentCue) + increment!).toFixed(5);
        while (newCue.endsWith('0')) newCue = newCue.slice(0, -1);
        entry.cue = newCue.endsWith('.') ? newCue.slice(0, -1) : newCue;
        currentCue = entry.cue;
        break;
      }
      case 'letter': {
        let [letter, number] = currentCue.split('.');
        number = number === undefined ? '1' : (Number(number) + increment!).toFixed(5);
        while (number.endsWith('0')) number = number.slice(0, -1);
        number = number.endsWith('.') ? number.slice(0, -1) : number;
        entry.cue = `${letter}.${number}`;
        currentCue = entry.cue;
        break;
      }
    }

    if (id === to) {
      foundTo = true;
      break;
    }
  }
  if (!foundFrom || !foundTo) throw new Error('Can not renumber without proper from and to ids');
  return entries;
}
