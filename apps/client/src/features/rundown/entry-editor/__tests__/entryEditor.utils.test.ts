import { OntimeEntry } from 'ontime-types';

import { getEditTarget, getPhaseThresholdIssue } from '../entryEditor.utils';

describe('getEditTarget()', () => {
  const entries = {
    a: { id: 'a' },
    b: { id: 'b' },
    c: { id: 'c' },
  } as unknown as Record<string, OntimeEntry>;

  it('returns null when nothing is selected', () => {
    expect(getEditTarget(new Set(), null, entries)).toBeNull();
    expect(getEditTarget(new Set(), 'a', entries)).toBeNull();
  });

  it('returns the cursor when it is selected', () => {
    expect(getEditTarget(new Set(['a', 'b', 'c']), 'c', entries)).toBe(entries.c);
  });

  it('returns the first selected entry when there is no cursor', () => {
    expect(getEditTarget(new Set(['b', 'c']), null, entries)).toBe(entries.b);
  });

  it('ignores a cursor that is no longer selected', () => {
    expect(getEditTarget(new Set(['b', 'c']), 'a', entries)).toBe(entries.b);
  });

  it('ignores a cursor that no longer exists in the rundown', () => {
    expect(getEditTarget(new Set(['deleted', 'b']), 'deleted', entries)).toBe(entries.b);
  });

  it('skips selected entries that no longer exist', () => {
    expect(getEditTarget(new Set(['deleted', 'c']), null, entries)).toBe(entries.c);
    expect(getEditTarget(new Set(['deleted']), 'deleted', entries)).toBeNull();
  });
});

describe('getPhaseThresholdIssue()', () => {
  it.each([
    ['valid thresholds', { timeWarning: 120000, timeDanger: 60000 }, 600000, null],
    ['a warning as long as the event', { timeWarning: 600000, timeDanger: 60000 }, 600000, 'warning-exceeds-duration'],
    ['a danger longer than the warning', { timeWarning: 60000, timeDanger: 120000 }, 600000, 'danger-exceeds-warning'],
    ['an event without duration', { timeWarning: 120000, timeDanger: 60000 }, 0, null],
  ])('finds %s', (_, thresholds, duration, expected) => {
    expect(getPhaseThresholdIssue(thresholds, duration)).toBe(expected);
  });
});
