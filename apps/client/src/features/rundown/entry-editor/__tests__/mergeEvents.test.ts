import { EndAction, OntimeEvent, SupportedEntry, TimerType } from 'ontime-types';

import { conflict, isConflict, mergeEvents, resolveConflict } from '../mergeEvents';

function makeEvent(patch: Partial<OntimeEvent>): OntimeEvent {
  return {
    type: SupportedEntry.Event,
    id: 'event',
    title: 'title',
    note: 'note',
    colour: '#FFCC78',
    flag: false,
    duration: 600000,
    endAction: EndAction.None,
    countToEnd: false,
    timerType: TimerType.CountDown,
    timeWarning: 120000,
    timeDanger: 60000,
    linkStart: true,
    custom: {},
    ...patch,
  } as OntimeEvent;
}

describe('mergeEvents()', () => {
  it('returns the values of a single event', () => {
    const event = makeEvent({ id: '1', title: 'only event' });

    expect(mergeEvents([event])).toStrictEqual({
      title: 'only event',
      note: 'note',
      colour: '#FFCC78',
      flag: false,
      duration: 600000,
      endAction: EndAction.None,
      countToEnd: false,
      timerType: TimerType.CountDown,
      timeWarning: 120000,
      timeDanger: 60000,
      linkStart: true,
      custom: {},
    });
  });

  it('keeps values which are shared by all events', () => {
    const merged = mergeEvents([makeEvent({ id: '1' }), makeEvent({ id: '2' }), makeEvent({ id: '3' })]);

    expect(merged.title).toBe('title');
    expect(merged.colour).toBe('#FFCC78');
    expect(merged.timerType).toBe(TimerType.CountDown);
    expect(merged.duration).toBe(600000);
  });

  it('marks only the fields which differ as conflicting', () => {
    const merged = mergeEvents([makeEvent({ id: '1', title: 'first' }), makeEvent({ id: '2', title: 'second' })]);

    expect(merged.title).toBe(conflict);
    expect(merged.note).toBe('note');
    expect(merged.colour).toBe('#FFCC78');
    expect(merged.flag).toBe(false);
  });

  it('handles boolean and numeric fields', () => {
    const merged = mergeEvents([
      makeEvent({ id: '1', flag: true, timeWarning: 1000, duration: 1000 }),
      makeEvent({ id: '2', flag: false, timeWarning: 1000, duration: 2000 }),
    ]);

    expect(merged.flag).toBe(conflict);
    expect(merged.timeWarning).toBe(1000);
    expect(merged.duration).toBe(conflict);
  });

  describe('custom fields', () => {
    it('merges values under the same key', () => {
      const merged = mergeEvents([
        makeEvent({ id: '1', custom: { lx: 'same', sound: 'a' } }),
        makeEvent({ id: '2', custom: { lx: 'same', sound: 'b' } }),
      ]);

      expect(merged.custom).toStrictEqual({ lx: 'same', sound: conflict });
    });

    it('treats a missing key as empty', () => {
      const merged = mergeEvents([makeEvent({ id: '1', custom: { lx: 'value' } }), makeEvent({ id: '2', custom: {} })]);

      expect(merged.custom).toStrictEqual({ lx: conflict });
    });

    it('collects keys from all events', () => {
      const merged = mergeEvents([
        makeEvent({ id: '1', custom: { lx: '' } }),
        makeEvent({ id: '2', custom: { sound: 'value' } }),
      ]);

      // lx is empty in both events, sound is only filled in one of them
      expect(merged.custom).toStrictEqual({ lx: '', sound: conflict });
    });

    it('does not report a key which is absent from every event', () => {
      const merged = mergeEvents([makeEvent({ id: '1', custom: {} }), makeEvent({ id: '2', custom: {} })]);

      expect(merged.custom).toStrictEqual({});
      // an absent key is distinguishable from a conflicting one
      expect(merged.custom.lx).toBeUndefined();
      expect(isConflict(merged.custom.lx)).toBe(false);
    });
  });
});

describe('resolveConflict()', () => {
  it('passes known values through', () => {
    expect(resolveConflict('value')).toBe('value');
    expect(resolveConflict(0)).toBe(0);
    expect(resolveConflict(false)).toBe(false);
    expect(resolveConflict('')).toBe('');
  });

  it('resolves a conflict to undefined', () => {
    expect(resolveConflict(conflict)).toBeUndefined();
  });
});
