import {
  EndAction,
  OntimeEvent,
  OntimeGroup,
  OntimeMilestone,
  TimeStrategy,
  TimerLifeCycle,
  TimerType,
  Trigger,
} from 'ontime-types';
import { MILLIS_PER_HOUR, createEvent } from 'ontime-utils';
import { assertType } from 'vitest';

import { makeOntimeEvent, makeOntimeGroup, makeOntimeMilestone, makeRundown } from '../__mocks__/rundown.mocks.js';
import { parseRundown } from '../rundown.parser.js';
import {
  calculateDayOffset,
  deleteById,
  doesInvalidateMetadata,
  getIntegerAndFraction,
  hasChanges,
  makeDeepClone,
  mergeRundownPreservingFields,
  isLoadedPlayable,
} from '../rundown.utils.js';

describe('test event validator', () => {
  it('validates a good object', () => {
    const event = {
      title: 'test',
    };
    const validated = createEvent(event, 1);

    expect(validated).toEqual(
      expect.objectContaining({
        title: expect.any(String),
        note: expect.any(String),
        timeStart: expect.any(Number),
        timeEnd: expect.any(Number),
        countToEnd: expect.any(Boolean),
        skip: expect.any(Boolean),
        revision: expect.any(Number),
        type: expect.any(String),
        id: expect.any(String),
        cue: '2',
        colour: expect.any(String),
        custom: expect.any(Object),
      }),
    );
  });

  it('fails an empty object', () => {
    const event = {};
    const validated = createEvent(event, 1);
    expect(validated).toEqual(null);
  });

  it('makes objects strings', () => {
    const event = {
      title: 2,
      note: '1899-12-30T08:00:10.000Z',
    };
    // @ts-expect-error -- we know this is wrong, testing imports outside domain
    const validated = createEvent(event, 1);
    if (validated === null) {
      throw new Error('unexpected value');
    }
    expect(typeof validated.title).toEqual('string');
    expect(typeof validated.note).toEqual('string');
  });

  it('enforces numbers on times', () => {
    const event = {
      timeStart: false,
      timeEnd: '2',
    };
    // @ts-expect-error -- we know this is wrong, testing imports outside domain
    const validated = createEvent(event);
    if (validated === null) {
      throw new Error('unexpected value');
    }
    assertType<number>(validated.timeStart);
    assertType<number>(validated.timeEnd);
    assertType<number>(validated.duration);
    expect(validated.timeStart).toEqual(0);
    expect(validated.timeEnd).toEqual(2);
    expect(validated.duration).toEqual(2);
  });

  it('handles bad objects', () => {
    const event = {
      title: {},
    };
    // @ts-expect-error -- we know this is wrong, testing imports outside domain
    const validated = createEvent(event);
    if (validated === null) {
      throw new Error('unexpected value');
    }
    expect(typeof validated.title).toEqual('string');
  });
});

describe('doesInvalidateMetadata()', () => {
  it('is stale if data contains timers', () => {
    const needsRecompute = [
      { timeStart: 10 },
      { timeEnd: 10 },
      { duration: 10 },
      { linkStart: true },
      { timerStrategy: TimeStrategy.LockDuration },
    ];

    for (const testCase of needsRecompute) {
      expect(doesInvalidateMetadata(testCase)).toBe(true);
    }
    expect.assertions(needsRecompute.length);
  });

  it('is not stale if data contains auxiliary dataset', () => {
    expect(
      doesInvalidateMetadata({
        cue: 'cue',
        title: 'title',
        note: 'note',
        endAction: EndAction.LoadNext,
        timerType: TimerType.Clock,
        colour: 'colour',
        timeWarning: 1,
        timeDanger: 2,
        custom: {
          lighting: '3',
        },
      }),
    ).toBe(false);
  });
});

describe('hasChanges()', () => {
  it('identifies objects with new values', () => {
    const newEvent = { id: '1', title: 'new-title' } as OntimeEvent;
    const existing = { id: '1', cue: 'cue', title: 'title' } as OntimeEvent;
    expect(hasChanges(existing, newEvent)).toBe(true);
  });
  it('identifies objects with all same values', () => {
    const newEvent = { id: '1', title: 'title' } as OntimeEvent;
    const existing = { id: '1', cue: 'cue', title: 'title' } as OntimeEvent;
    expect(hasChanges(existing, newEvent)).toBe(false);
  });
});

describe('deleteById()', () => {
  it('should delete the first instance of the specified ID from the array', () => {
    const array = ['id1', 'id2', 'id3', 'id4'];
    const result = deleteById(array, 'id2');
    expect(result).toStrictEqual(['id1', 'id3', 'id4']);
    expect(result).not.toBe(array); // Ensure a new array is returned
  });

  it('should not modify the array if the specified ID does not exist', () => {
    const array = ['id1', 'id2', 'id3', 'id4'];
    const result = deleteById(array, 'id5');
    expect(result).toStrictEqual(['id1', 'id2', 'id3', 'id4']);
  });

  it('should return the same array if it is empty', () => {
    const array: string[] = [];
    const result = deleteById(array, 'id1');
    expect(result).toStrictEqual([]);
  });

  it('should handle scenarios where the delete id is not found', () => {
    const array = ['id1', 'id2', 'id3'];
    const result = deleteById(array, 'id4');
    expect(result).toStrictEqual(['id1', 'id2', 'id3']);
  });
});

describe('calculateDayOffset()', () => {
  it('returns 0 if there is no previous event', () => {
    expect(calculateDayOffset({ timeStart: 0 }, null)).toBe(0);
  });

  it('returns 0 if the previous event duration is 0', () => {
    expect(calculateDayOffset({ timeStart: 0 }, { timeStart: 0, duration: 0 })).toBe(0);
  });

  it('returns 0 if event starts after previous', () => {
    expect(calculateDayOffset({ timeStart: 11 }, { timeStart: 10, duration: 2 })).toBe(0);
  });

  it('returns 1 if event starts before previous', () => {
    expect(calculateDayOffset({ timeStart: 9 }, { timeStart: 10, duration: 2 })).toBe(1);
  });

  it('returns 1 if event starts at the same time as one before', () => {
    expect(calculateDayOffset({ timeStart: 10 }, { timeStart: 10, duration: 2 })).toBe(1);
  });

  it('should account for an event that crossed midnight and there is a overlap', () => {
    expect(
      calculateDayOffset(
        { timeStart: MILLIS_PER_HOUR }, // starts at 01:00:00
        { timeStart: 20 * MILLIS_PER_HOUR, duration: 6 * MILLIS_PER_HOUR }, // ends at 02:00:00
      ),
    ).toBe(1);
  });

  it('should account for an event that crossed midnight and there is a gap', () => {
    expect(
      calculateDayOffset(
        { timeStart: 2 * MILLIS_PER_HOUR }, // starts at 02:00:00
        { timeStart: 23 * MILLIS_PER_HOUR, duration: 2 * MILLIS_PER_HOUR }, // ends at 01:00:00
      ),
    ).toBe(1);
  });

  it('should account for an event that crossed midnight with no overlaps or gaps', () => {
    expect(
      calculateDayOffset(
        { timeStart: 2 * MILLIS_PER_HOUR }, // starts at 02:00:00
        { timeStart: 20 * MILLIS_PER_HOUR, duration: 6 * MILLIS_PER_HOUR }, // ends at 02:00:00
      ),
    ).toBe(1);
  });

  it('should account for an event that finishes exactly at midnight', () => {
    expect(
      calculateDayOffset(
        { timeStart: 2 * MILLIS_PER_HOUR }, // starts at 02:00:00
        { timeStart: 23 * MILLIS_PER_HOUR, duration: 6 * MILLIS_PER_HOUR }, // ends at 24:00:00
      ),
    ).toBe(1);
  });
});

describe('makeDeepClone()', () => {
  it('deep clones a group along with its nested entries', () => {
    const group1 = makeOntimeGroup({ id: 'group1', title: 'Group 1', entries: ['event1', 'event2'] });
    const rundown = makeRundown({
      entries: {
        group1,
        event1: makeOntimeEvent({ id: 'event1', title: 'Event 1', parent: 'group1' }),
        event2: makeOntimeEvent({ id: 'event2', title: 'Event 2', parent: 'group1' }),
      },
      order: ['group1'],
      flatOrder: ['group1', 'event1', 'event2'],
    });

    const { newGroup, nestedEntries } = makeDeepClone(group1, rundown);

    expect(newGroup).toMatchObject({
      id: expect.any(String),
      title: 'Group 1 (copy)',
      entries: [expect.any(String), expect.any(String)],
      revision: 0,
    });
    expect(newGroup.id).not.toEqual('group1');
    expect(newGroup.entries.length).toEqual(group1.entries.length);

    expect(nestedEntries).toMatchObject([
      {
        id: expect.any(String),
        title: 'Event 1',
        parent: newGroup.id,
        revision: 0,
      },
      {
        id: expect.any(String),
        title: 'Event 2',
        parent: newGroup.id,
        revision: 0,
      },
    ]);
  });
});

describe('getIntegerAndFraction()', () => {
  test('integer without fraction', () => {
    expect(getIntegerAndFraction('123')).toStrictEqual({ integer: 123, faction: 0, precision: 0 });
  });

  test('integer and fraction', () => {
    expect(getIntegerAndFraction('123.456')).toStrictEqual({ integer: 123, faction: 456, precision: 3 });
  });

  test('invalid integer', () => {
    expect(() => getIntegerAndFraction('abc.456')).toThrowError('input can not be converted to a number');
  });

  test('indicate precision just with zeros', () => {
    expect(getIntegerAndFraction('123.000')).toStrictEqual({ integer: 123, faction: 0, precision: 3 });
  });

  test('invalid fraction', () => {
    expect(() => getIntegerAndFraction('123.abc')).toThrowError('input can not be converted to a number');
  });

  test('floating separator', () => {
    expect(getIntegerAndFraction('123.')).toStrictEqual({ integer: 123, faction: 0, precision: 0 });
  });
});

/**
 * The merge strategy takes the incoming (spreadsheet) rundown as the source of truth for structure
 * and order. For a matched event it only applies the fields the spreadsheet mapped (providedFields);
 * any field it does not provide (e.g. automations) is kept from the existing event.
 */
describe('mergeRundownPreservingFields()', () => {
  const automation: Trigger = {
    id: 'trigger-onair',
    title: 'Go on air',
    trigger: TimerLifeCycle.onStart,
    automationId: 'automation-onair',
  };

  it('keeps the current rundown identity but takes structure and order from the incoming rundown', () => {
    const current = makeRundown({
      id: 'show-rundown',
      title: 'Main show',
      revision: 3,
      order: ['welcome', 'keynote'],
      entries: {
        welcome: makeOntimeEvent({ id: 'welcome', title: 'Welcome' }),
        keynote: makeOntimeEvent({ id: 'keynote', title: 'Keynote' }),
      },
    });
    const incoming = makeRundown({
      id: 'spreadsheet-rundown',
      title: 'From spreadsheet',
      revision: 0,
      order: ['welcome', 'lunch'],
      entries: {
        welcome: makeOntimeEvent({ id: 'welcome', title: 'Welcome' }),
        lunch: makeOntimeEvent({ id: 'lunch', title: 'Lunch' }),
      },
    });

    const merged = mergeRundownPreservingFields(incoming, current, { event: ['title'], custom: [] });

    // identity and revision come from the current rundown
    expect(merged.id).toBe('show-rundown');
    expect(merged.title).toBe('Main show');
    expect(merged.revision).toBe(4);
    // structure and order come from the incoming rundown
    expect(merged.order).toEqual(['welcome', 'lunch']);
    expect(merged.flatOrder).toEqual(incoming.flatOrder);
  });

  it('deletes current entries that are absent from the incoming rundown', () => {
    const current = makeRundown({
      id: 'show-rundown',
      order: ['welcome', 'keynote'],
      entries: {
        welcome: makeOntimeEvent({ id: 'welcome' }),
        keynote: makeOntimeEvent({ id: 'keynote' }),
      },
    });
    const incoming = makeRundown({
      id: 'spreadsheet-rundown',
      order: ['welcome'],
      entries: { welcome: makeOntimeEvent({ id: 'welcome' }) },
    });

    const merged = mergeRundownPreservingFields(incoming, current, { event: ['title'], custom: [] });

    expect(merged.entries.welcome).toBeDefined();
    expect(merged.entries.keynote).toBeUndefined();
  });

  it('replaces an entry entirely with the incoming data when the id is kept but the type changes', () => {
    const current = makeRundown({
      id: 'show-rundown',
      order: ['keynote'],
      entries: { keynote: makeOntimeEvent({ id: 'keynote', title: 'Keynote', triggers: [automation] }) },
    });
    const incoming = makeRundown({
      id: 'spreadsheet-rundown',
      order: ['keynote'],
      entries: { keynote: makeOntimeGroup({ id: 'keynote', title: 'Keynote group' }) },
    });

    const merged = mergeRundownPreservingFields(incoming, current, { event: ['title'], custom: [] });

    // the incoming group fully replaces the previous event, no old data is carried over
    expect(merged.entries.keynote).toEqual(incoming.entries.keynote);
  });

  it('applies the provided fields to a matched event, including when the incoming value is empty', () => {
    const current = makeRundown({
      id: 'show-rundown',
      order: ['keynote'],
      entries: { keynote: makeOntimeEvent({ id: 'keynote', title: 'Keynote', note: 'in the green room' }) },
    });
    const incoming = makeRundown({
      id: 'spreadsheet-rundown',
      order: ['keynote'],
      entries: { keynote: makeOntimeEvent({ id: 'keynote', title: 'Opening keynote', note: '' }) },
    });

    // the sheet mapped title and note
    const merged = mergeRundownPreservingFields(incoming, current, { event: ['title', 'note'], custom: [] });
    const keynote = merged.entries.keynote as OntimeEvent;

    expect(keynote.title).toBe('Opening keynote');
    // an empty provided value replaces the current one
    expect(keynote.note).toBe('');
  });

  it('keeps fields the sheet did not map on a matched event, regardless of the incoming values', () => {
    const current = makeRundown({
      id: 'show-rundown',
      order: ['keynote'],
      entries: {
        keynote: makeOntimeEvent({ id: 'keynote', title: 'Keynote', note: 'green room', triggers: [automation] }),
      },
    });
    // the preview always fully populates an entry, so the incoming carries a note and triggers; what
    // the sheet actually supplied is providedFields, not the values that happen to be on the entry
    const incoming = makeRundown({
      id: 'spreadsheet-rundown',
      order: ['keynote'],
      entries: {
        keynote: makeOntimeEvent({
          id: 'keynote',
          title: 'Opening keynote',
          note: 'from a stale column',
          triggers: [],
        }),
      },
    });

    // only title is mapped, so note and automations keep the existing values, not the incoming ones
    const merged = mergeRundownPreservingFields(incoming, current, { event: ['title'], custom: [] });
    const keynote = merged.entries.keynote as OntimeEvent;

    expect(keynote.title).toBe('Opening keynote');
    expect(keynote.note).toBe('green room');
    expect(keynote.triggers).toEqual([automation]);
  });

  it('patches the provided custom fields on a matched event and keeps the unmapped ones', () => {
    const current = makeRundown({
      id: 'show-rundown',
      order: ['keynote'],
      entries: {
        keynote: makeOntimeEvent({
          id: 'keynote',
          title: 'Keynote',
          custom: { lighting: 'warm', song: 'intro theme' },
        }),
      },
    });
    const incoming = makeRundown({
      id: 'spreadsheet-rundown',
      order: ['keynote'],
      entries: {
        keynote: makeOntimeEvent({ id: 'keynote', title: 'Opening keynote', custom: { lighting: 'cold' } }),
      },
    });

    // the sheet mapped the title and the lighting custom field, but not song
    const merged = mergeRundownPreservingFields(incoming, current, { event: ['title'], custom: ['lighting'] });
    const keynote = merged.entries.keynote as OntimeEvent;

    expect(keynote.title).toBe('Opening keynote');
    expect(keynote.custom.lighting).toBe('cold');
    // an unmapped custom field is kept from the existing event
    expect(keynote.custom.song).toBe('intro theme');
  });

  it('infers the time strategy from the provided times when the sheet is unambiguous', () => {
    const current = makeRundown({
      id: 'show-rundown',
      order: ['keynote'],
      entries: { keynote: makeOntimeEvent({ id: 'keynote', timeStrategy: TimeStrategy.LockEnd }) },
    });
    // the sheet provides only a duration, so the strategy is unambiguously LockDuration
    const incoming = makeRundown({
      id: 'spreadsheet-rundown',
      order: ['keynote'],
      entries: { keynote: makeOntimeEvent({ id: 'keynote', duration: 60000 }) },
    });

    const merged = mergeRundownPreservingFields(incoming, current, { event: ['duration'], custom: [] });

    expect((merged.entries.keynote as OntimeEvent).timeStrategy).toBe(TimeStrategy.LockDuration);
  });

  it('keeps the existing time strategy when the provided times are ambiguous', () => {
    const current = makeRundown({
      id: 'show-rundown',
      order: ['keynote'],
      entries: { keynote: makeOntimeEvent({ id: 'keynote', timeStrategy: TimeStrategy.LockEnd }) },
    });
    // the sheet provides both an end and a duration, so the strategy cannot be inferred from them
    const incoming = makeRundown({
      id: 'spreadsheet-rundown',
      order: ['keynote'],
      entries: { keynote: makeOntimeEvent({ id: 'keynote', timeEnd: 60000, duration: 60000 }) },
    });

    const merged = mergeRundownPreservingFields(incoming, current, { event: ['timeEnd', 'duration'], custom: [] });

    expect((merged.entries.keynote as OntimeEvent).timeStrategy).toBe(TimeStrategy.LockEnd);
  });

  it('merges a matched group, keeping the fields the sheet cannot express', () => {
    const current = makeRundown({
      id: 'show-rundown',
      order: ['session'],
      entries: { session: makeOntimeGroup({ id: 'session', title: 'Old session', targetDuration: 3_600_000 }) },
    });
    // the sheet cannot express a group's target duration, so the incoming group does not carry one
    const incoming = makeRundown({
      id: 'spreadsheet-rundown',
      order: ['session'],
      entries: { session: makeOntimeGroup({ id: 'session', title: 'New session', targetDuration: null }) },
    });

    const merged = mergeRundownPreservingFields(incoming, current, { event: ['title'], custom: [] });
    const session = merged.entries.session as OntimeGroup;

    expect(session.title).toBe('New session');
    expect(session.targetDuration).toBe(3_600_000);
  });

  it('merges a matched milestone, keeping the fields the sheet did not map', () => {
    const current = makeRundown({
      id: 'show-rundown',
      order: ['reminder'],
      entries: { reminder: makeOntimeMilestone({ id: 'reminder', title: 'Reminder', note: 'call talent' }) },
    });
    const incoming = makeRundown({
      id: 'spreadsheet-rundown',
      order: ['reminder'],
      entries: { reminder: makeOntimeMilestone({ id: 'reminder', title: 'Green room reminder', note: 'ignored' }) },
    });

    // only title is mapped, so the milestone's note keeps the existing value
    const merged = mergeRundownPreservingFields(incoming, current, { event: ['title'], custom: [] });
    const reminder = merged.entries.reminder as OntimeMilestone;

    expect(reminder.title).toBe('Green room reminder');
    expect(reminder.note).toBe('call talent');
  });

  it('does not mutate the current rundown and deep-clones the kept automations', () => {
    const current = makeRundown({
      id: 'show-rundown',
      order: ['keynote'],
      entries: { keynote: makeOntimeEvent({ id: 'keynote', triggers: [automation] }) },
    });
    const incoming = makeRundown({
      id: 'spreadsheet-rundown',
      order: ['keynote'],
      entries: { keynote: makeOntimeEvent({ id: 'keynote', triggers: [] }) },
    });

    const merged = mergeRundownPreservingFields(incoming, current, { event: ['title'], custom: [] });

    // kept automations are a copy, not a shared reference to the current rundown
    (merged.entries.keynote as OntimeEvent).triggers.push({ ...automation, id: 'trigger-extra' });
    expect((current.entries.keynote as OntimeEvent).triggers).toEqual([automation]);
  });

  it('keeps the not-provided fields through a parseRundown round-trip', () => {
    const current = makeRundown({
      id: 'show-rundown',
      order: ['keynote'],
      entries: {
        keynote: makeOntimeEvent({ id: 'keynote', triggers: [automation], timeStrategy: TimeStrategy.LockEnd }),
      },
    });
    const incoming = makeRundown({
      id: 'spreadsheet-rundown',
      order: ['keynote'],
      entries: { keynote: makeOntimeEvent({ id: 'keynote', title: 'Keynote', triggers: [] }) },
    });

    const merged = mergeRundownPreservingFields(incoming, current, { event: ['title'], custom: [] });
    const parsed = parseRundown(merged, {});
    const keynote = parsed.entries.keynote as OntimeEvent;

    expect(keynote.triggers).toEqual([automation]);
    expect(keynote.timeStrategy).toBe(TimeStrategy.LockEnd);
  });
});

describe('isLoadedPlayable()', () => {
  it('returns true when the loaded event still exists and is playable', () => {
    const rundown = makeRundown({ order: ['keynote'], entries: { keynote: makeOntimeEvent({ id: 'keynote' }) } });
    expect(isLoadedPlayable('keynote', rundown)).toBe(true);
  });

  it('returns false when the loaded event was removed', () => {
    const rundown = makeRundown({ order: ['welcome'], entries: { welcome: makeOntimeEvent({ id: 'welcome' }) } });
    expect(isLoadedPlayable('keynote', rundown)).toBe(false);
  });

  it('returns false when the loaded event is now skipped', () => {
    const rundown = makeRundown({
      order: ['keynote'],
      entries: { keynote: makeOntimeEvent({ id: 'keynote', skip: true }) },
    });
    expect(isLoadedPlayable('keynote', rundown)).toBe(false);
  });

  it('returns false when the matched entry is no longer an event', () => {
    const rundown = makeRundown({ order: ['keynote'], entries: { keynote: makeOntimeGroup({ id: 'keynote' }) } });
    expect(isLoadedPlayable('keynote', rundown)).toBe(false);
  });
});
