import { TimeStrategy, EndAction, TimerType, OntimeEvent, OntimeBlock } from 'ontime-types';
import { MILLIS_PER_HOUR } from 'ontime-utils';

import { assertType } from 'vitest';

import {
  calculateDayOffset,
  createEvent,
  deleteById,
  doesInvalidateMetadata,
  getInsertAfterId,
  hasChanges,
} from '../rundown.utils.js';
import { makeOntimeBlock, makeOntimeEvent, makeRundown } from '../__mocks__/rundown.mocks.js';

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
    expect(calculateDayOffset(null)).toBe(0);
  });

  it('returns 0 if the previous event duration is 0', () => {
    expect(calculateDayOffset({ timeStart: 0, duration: 0 })).toBe(0);
  });

  it('returns 0 if event starts after previous', () => {
    expect(calculateDayOffset({ timeStart: 10, duration: 2 })).toBe(0);
  });

  it('should account for an event that crossed midnight and there is a overlap', () => {
    expect(
      calculateDayOffset(
        { timeStart: 20 * MILLIS_PER_HOUR, duration: 6 * MILLIS_PER_HOUR }, // ends at 02:00:00
      ),
    ).toBe(1);
  });

  it('should account for an event that crossed midnight and there is a gap', () => {
    expect(
      calculateDayOffset(
        { timeStart: 23 * MILLIS_PER_HOUR, duration: 2 * MILLIS_PER_HOUR }, // ends at 01:00:00
      ),
    ).toBe(1);
  });

  it('should account for an event that crossed midnight with no overlaps or gaps', () => {
    expect(
      calculateDayOffset(
        { timeStart: 20 * MILLIS_PER_HOUR, duration: 6 * MILLIS_PER_HOUR }, // ends at 02:00:00
      ),
    ).toBe(1);
  });

  it('should account for an event that finishes exactly at midnight', () => {
    expect(
      calculateDayOffset(
        { timeStart: 23 * MILLIS_PER_HOUR, duration: 6 * MILLIS_PER_HOUR }, // ends at 24:00:00
      ),
    ).toBe(1);
  });
});

describe('getInsertAfterId()', () => {
  const rundown = makeRundown({
    entries: {
      '1': makeOntimeEvent({ id: '1', parent: null }),
      '2': makeOntimeEvent({ id: '2', parent: null }),
      block: makeOntimeBlock({ id: 'block', entries: ['31', '32'] }),
      '31': makeOntimeEvent({ id: '31', parent: 'block' }),
      '32': makeOntimeEvent({ id: '32', parent: 'block' }),
      '4': makeOntimeEvent({ id: '31', parent: null }),
    },
    order: ['1', '2', 'block', '4'],
    flatOrder: ['1', '2', 'block', '31', '32', '4'],
  });

  it('returns afterId if provided', () => {
    expect(getInsertAfterId(rundown, null, 'b')).toBe('b');
  });

  it('returns null if neither afterId nor beforeId is provided', () => {
    expect(getInsertAfterId(rundown, null)).toBeNull();
  });

  it('returns null if beforeId is not found', () => {
    expect(getInsertAfterId(rundown, null, undefined, 'z')).toBeNull();
    expect(getInsertAfterId(rundown, null, undefined, '1')).toBeNull();
  });

  it('returns the previous id of an entry in the rundown', () => {
    expect(getInsertAfterId(rundown, null, undefined, '2')).toBe('1');
    expect(getInsertAfterId(rundown, null, undefined, '4')).toBe('block');
    expect(getInsertAfterId(rundown, null, undefined, 'block')).toBe('2');
  });

  it('returns the previous id of an event in a block', () => {
    expect(getInsertAfterId(rundown, rundown.entries.block as OntimeBlock, undefined, '31')).toBeNull();
    expect(getInsertAfterId(rundown, rundown.entries.block as OntimeBlock, undefined, '32')).toBe('31');
  });
});
