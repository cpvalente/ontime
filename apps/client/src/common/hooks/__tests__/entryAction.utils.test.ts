import { OntimeEvent, OntimeGroup, RundownEntries, SupportedEntry } from 'ontime-types';

import { applyPatchToEvents, canPredictBatchResult } from '../entryAction.utils';

function makeEntries(): RundownEntries {
  return {
    '1': { type: SupportedEntry.Event, id: '1', title: 'one', custom: { lx: 'a', sound: 'x' } } as OntimeEvent,
    '2': { type: SupportedEntry.Event, id: '2', title: 'two', custom: { lx: 'b' } } as OntimeEvent,
    '3': { type: SupportedEntry.Event, id: '3', title: 'three', custom: {} } as OntimeEvent,
    group: { type: SupportedEntry.Group, id: 'group', title: 'a group', custom: {} } as OntimeGroup,
  };
}

describe('applyPatchToEvents()', () => {
  it('applies the patch to the given events only', () => {
    const patched = applyPatchToEvents(makeEntries(), ['1', '2'], { title: 'patched' });

    expect((patched['1'] as OntimeEvent).title).toBe('patched');
    expect((patched['2'] as OntimeEvent).title).toBe('patched');
    expect((patched['3'] as OntimeEvent).title).toBe('three');
  });

  it('patches custom fields instead of replacing them', () => {
    const patched = applyPatchToEvents(makeEntries(), ['1', '2'], { custom: { lx: 'new' } });

    // the field which was not part of the patch must survive
    expect((patched['1'] as OntimeEvent).custom).toStrictEqual({ lx: 'new', sound: 'x' });
    expect((patched['2'] as OntimeEvent).custom).toStrictEqual({ lx: 'new' });
  });

  it('keeps the existing custom fields when the patch has none', () => {
    const patched = applyPatchToEvents(makeEntries(), ['1'], { title: 'patched' });

    expect((patched['1'] as OntimeEvent).custom).toStrictEqual({ lx: 'a', sound: 'x' });
  });

  it('ignores ids which are not in the rundown', () => {
    const patched = applyPatchToEvents(makeEntries(), ['1', 'does-not-exist'], { title: 'patched' });

    expect(Object.keys(patched)).toStrictEqual(['1', '2', '3', 'group']);
    expect((patched['1'] as OntimeEvent).title).toBe('patched');
  });

  it('ignores entries which are not events', () => {
    const patched = applyPatchToEvents(makeEntries(), ['group'], { title: 'patched' });

    expect((patched.group as OntimeGroup).title).toBe('a group');
  });

  it('does not mutate the given entries', () => {
    const entries = makeEntries();
    applyPatchToEvents(entries, ['1'], { title: 'patched', custom: { lx: 'new' } });

    expect((entries['1'] as OntimeEvent).title).toBe('one');
    expect((entries['1'] as OntimeEvent).custom).toStrictEqual({ lx: 'a', sound: 'x' });
  });

  it('handles repeated ids', () => {
    const patched = applyPatchToEvents(makeEntries(), ['1', '1'], { title: 'patched' });

    expect((patched['1'] as OntimeEvent).title).toBe('patched');
  });
});

describe('canPredictBatchResult()', () => {
  it('allows resolving patches which do not affect the schedule', () => {
    expect(canPredictBatchResult({ title: 'a title' })).toBe(true);
    expect(canPredictBatchResult({ colour: 'red', flag: true })).toBe(true);
  });

  it('defers to the server when the duration changes', () => {
    // a duration cascades into the start and end of every linked event
    expect(canPredictBatchResult({ duration: 1000 })).toBe(false);
    expect(canPredictBatchResult({ title: 'a title', duration: 1000 })).toBe(false);
  });
});
