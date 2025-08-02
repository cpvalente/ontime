import { MaybeNumber } from 'ontime-types';
import { millisToString } from 'ontime-utils';

import { enDash } from './styleUtils';

/**
 * Formats offset text
 */
export function getOffsetText(offset: MaybeNumber): string {
  if (offset === null) {
    return enDash;
  }

  let offsetText = '';
  if (offset < 0) offsetText += '-';
  if (offset > 0) offsetText += '+';
  offsetText += millisToString(Math.abs(offset));
  return offsetText;
}

export function getOffsetState(offset: MaybeNumber): 'over' | 'under' | 'muted' | null {
  if (offset === null) return 'muted';
  if (offset === 0) return null;
  return offset < 0 ? 'over' : 'under';
}
