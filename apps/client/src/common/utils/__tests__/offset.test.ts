import { MILLIS_PER_MINUTE } from 'ontime-utils';
import { describe, expect, it } from 'vitest';

import { getOffsetState, getOffsetText } from '../offset';
import { enDash } from '../styleUtils';

describe('schedule offset', () => {
  it('shows a running-late show as positive and "over"', () => {
    expect(getOffsetText(5 * MILLIS_PER_MINUTE)).toBe('+5:00');
    expect(getOffsetState(5 * MILLIS_PER_MINUTE)).toBe('over');
  });

  it('shows an ahead-of-schedule show as negative and "under"', () => {
    expect(getOffsetText(-5 * MILLIS_PER_MINUTE)).toBe('-5:00');
    expect(getOffsetState(-5 * MILLIS_PER_MINUTE)).toBe('under');
  });

  it('shows an on-time show without a sign or state', () => {
    expect(getOffsetText(0)).toBe('0:00');
    expect(getOffsetState(0)).toBeNull();
  });

  it('shows a placeholder when there is no offset to report', () => {
    expect(getOffsetText(null)).toBe(enDash);
    expect(getOffsetState(null)).toBe('muted');
  });
});
