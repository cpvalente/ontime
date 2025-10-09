import type { EntryId, OntimeEntry, RundownEntries } from 'ontime-types';
import { isOntimeEvent } from 'ontime-types';

import { getFirstEventNormal, getNextEventNormal, getPreviousEventNormal } from '../rundown-utils/rundownUtils.js';
import { isNumeric } from '../types/types.js';

// Zero or more non-digit characters at the beginning ((\D*)).
// One or more digits ((\d+)).
// Optionally, a decimal part starting with a dot ((\.\d+)?).
const regex = /^(\D*)(\d+)(\.)?(\d+)?$/;

/**
 * Finds if last characters in input are a number and increments
 */
export function getIncrement(input: string, next?: string): string {
  console.log({ input, next });
  // Check if the input string contains a number at the end
  const match = regex.exec(input);
  const matchNext = next ? regex.exec(next) : null;

  if (match) {
    // If a number is found, extract the non-numeric prefix, integer part, and decimal part
    const [, prefix, integerPart, _dot, decimalPart] = match;
    const floatPart = parseFloat(integerPart + '.' + decimalPart);

    if (matchNext) {
      const [, prefix_next, integerPart_next, _dot, decimalPart_next] = matchNext;
      const floatPart_ext = parseFloat(integerPart_next + '.' + decimalPart_next);
      if (prefix === prefix_next) {
        const floatDistance = floatPart_ext - floatPart;
        console.log({ prefix, prefix_next, floatPart_ext, floatPart, floatDistance });
        if (floatDistance > 1) {
          return `${prefix}${Number(integerPart) + 1}`;
        }
        if (floatDistance > 0.1001) {
          // the 001 is here to catch floating point errors
          const newDecimal = getFormatDecimalPart(floatPart + 0.1);
          return `${prefix}${integerPart}.${newDecimal}`;
        }
        const newDecimal = getFormatDecimalPart(floatPart + floatDistance / 2);
        return `${prefix}${integerPart}.${newDecimal}`;
      }
    }

    if (integerPart) {
      return `${prefix}${Number(integerPart) + 1}`;
    }

    if (decimalPart) {
      const newDecimal = getFormatDecimalPart(floatPart + 0.1);
      console.log({ floatPart, newDecimal });
      return `${prefix}${integerPart}.${newDecimal}`;
    }
  }
  // If no number is found, append "2" to the string and return the updated string
  return `${input}2`;
}

const dFormat = new Intl.NumberFormat('en-US', { style: 'decimal', maximumFractionDigits: 3 });

function getFormatDecimalPart(value: number) {
  const result = dFormat.formatToParts(value);
  return result.length > 1 ? result.at(-1)?.value ?? '1' : result[0].value;
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
