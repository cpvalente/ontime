import { CustomFields, OntimeEvent, SupportedEntry, TimeStrategy } from 'ontime-types';
import { MILLIS_PER_HOUR, MILLIS_PER_MINUTE, dayInMs } from 'ontime-utils';

import { demoDb } from '../../../models/demoProject.js';

import {
  add,
  batchEdit,
  edit,
  generate,
  remove,
  reorder,
  swap,
  createCustomField,
  editCustomField,
  removeCustomField,
  customFieldChangelog,
} from '../rundownCache.js';
import { makeOntimeBlock, makeOntimeDelay, makeOntimeEvent, makeRundown } from '../__mocks__/rundown.mocks.js';
import { ProcessedRundownMetadata } from '../rundownCache.utils.js';

beforeAll(() => {
  vi.mock('../../../classes/data-provider/DataProvider.js', () => {
    return {
      getDataProvider: vi.fn().mockImplementation(() => {
        return {
          setCustomFields: vi.fn().mockImplementation((newData) => newData),
          setRundown: vi.fn().mockImplementation((newData) => newData),
        };
      }),
    };
  });
});

describe('generate()', () => {
  test('benchmark function execution time', () => {
    const t1 = performance.now();
    let result: ProcessedRundownMetadata | null = null;
    for (let i = 0; i < 100; i++) {
      result = generate(demoDb.rundowns.default, demoDb.customFields);
    }
    const t2 = performance.now();
    console.warn(
      'Rundown generation took',
      t2 - t1,
      'milliseconds for 100x',
      Object.keys(result?.entries ?? {}).length,
      'events',
    );
  });

  it('generates metadata from given rundown', () => {
    const initResult = generate(demoDb.rundowns.default, demoDb.customFields);

    expect(initResult.order.length).toBe(12);
    expect(initResult.flatEntryOrder.length).toBe(17);
    expect(initResult.timedEventOrder.length).toBe(14);
    expect(initResult.playableEventOrder.length).toBe(14);
    expect(initResult.firstStart).toBe(36000000);
    expect(initResult.lastEnd).toBe(61800000);
    expect(initResult.totalDays).toBe(0);
    expect(initResult.totalDelay).toBe(0);
  });

  it('creates normalised versions of a given rundown', () => {
    const rundown = makeRundown({
      order: ['1', '2', '3'],
      entries: {
        '1': makeOntimeEvent({ id: '1' }),
        '2': makeOntimeBlock({ id: '2' }),
        '3': makeOntimeDelay({ id: '3' }),
      },
    });

    const initResult = generate(rundown, {});
    expect(initResult.order.length).toBe(3);
    expect(initResult.order).toStrictEqual(['1', '2', '3']);
    expect(initResult.entries['1'].type).toBe(SupportedEntry.Event);
    expect(initResult.entries['2'].type).toBe(SupportedEntry.Block);
    expect(initResult.entries['3'].type).toBe(SupportedEntry.Delay);
  });

  it('calculates delays versions of a given rundown', () => {
    const rundown = makeRundown({
      order: ['1', '2'],
      entries: {
        '1': makeOntimeDelay({ id: '1', duration: 100 }),
        '2': makeOntimeEvent({ id: '2', timeStart: 1, timeEnd: 100 }),
      },
    });

    const initResult = generate(rundown, {});
    expect(initResult.order.length).toBe(2);
    expect((initResult.entries['2'] as OntimeEvent).delay).toBe(100);
    expect(initResult.totalDelay).toBe(100);
  });

  it('accounts for gaps in rundown when calculating delays', () => {
    const rundown = makeRundown({
      order: ['1', 'delay', '2', 'block', '3', 'another-block', '4'],
      entries: {
        '1': makeOntimeEvent({ id: '1', timeStart: 100, timeEnd: 200, duration: 100 }),
        delay: makeOntimeDelay({ id: 'delay', duration: 200 }),
        '2': makeOntimeEvent({ id: '2', timeStart: 200, timeEnd: 300, duration: 100 }),
        block: makeOntimeBlock({ id: 'block', title: 'break' }),
        '3': makeOntimeEvent({ id: '3', timeStart: 400, timeEnd: 500, duration: 100 }),
        'another-block': makeOntimeBlock({ id: 'another-block', title: 'another-break' }),
        '4': makeOntimeEvent({ id: '4', timeStart: 600, timeEnd: 700, duration: 100 }),
      },
    });

    const initResult = generate(rundown, {});
    expect(initResult.order.length).toBe(7);
    expect((initResult.entries['1'] as OntimeEvent).delay).toBe(0);
    expect((initResult.entries['2'] as OntimeEvent).delay).toBe(200);
    expect((initResult.entries['3'] as OntimeEvent).delay).toBe(100);
    expect((initResult.entries['4'] as OntimeEvent).delay).toBe(0);
    expect(initResult.totalDelay).toBe(0);
    expect(initResult.totalDuration).toBe(700 - 100);
  });

  it('accounts for overlaps in rundown', () => {
    const rundown = makeRundown({
      order: ['1', '2', '3'],
      entries: {
        '1': makeOntimeEvent({ id: '1', timeStart: 9000, timeEnd: 10000, duration: 1000 }),
        '2': makeOntimeEvent({ id: '2', timeStart: 9250, timeEnd: 9500, duration: 250 }),
        '3': makeOntimeEvent({ id: '3', timeStart: 9500, timeEnd: 10500, duration: 1000 }),
      },
    });

    const initResult = generate(rundown, {});
    expect(initResult.totalDuration).toBe(10500 - 9000); // last end - first start
  });

  it('accounts for overlaps in rundown (with added gap)', () => {
    const rundown = makeRundown({
      order: ['1', '2', '3', '4'],
      entries: {
        '1': makeOntimeEvent({ id: '1', timeStart: 9000, timeEnd: 10000, duration: 1000 }),
        '2': makeOntimeEvent({ id: '2', timeStart: 9250, timeEnd: 9500, duration: 250 }),
        '3': makeOntimeEvent({ id: '3', timeStart: 9500, timeEnd: 10500, duration: 1000 }),
        '4': makeOntimeEvent({ id: '4', timeStart: 15000, timeEnd: 20000, duration: 5000 }),
      },
    });

    const initResult = generate(rundown, {});
    expect(initResult.totalDuration).toBe(20000 - 9000); // last end - first start
  });

  it('accounts for overlaps in rundown (with multiple days)', () => {
    const rundown = makeRundown({
      order: ['1', '2', '3', '4'],
      entries: {
        '1': makeOntimeEvent({
          id: '1',
          timeStart: 9 * MILLIS_PER_HOUR,
          timeEnd: 10 * MILLIS_PER_HOUR,
          duration: MILLIS_PER_HOUR,
        }),
        '2': makeOntimeEvent({
          id: '2',
          timeStart: 9 * MILLIS_PER_HOUR + 15 * MILLIS_PER_MINUTE,
          timeEnd: 9 * MILLIS_PER_HOUR + 45 * MILLIS_PER_MINUTE,
          duration: 30 * MILLIS_PER_MINUTE,
        }),
        '3': makeOntimeEvent({
          id: '3',
          timeStart: 9 * MILLIS_PER_HOUR + 30 * MILLIS_PER_MINUTE,
          timeEnd: 10 * MILLIS_PER_HOUR + 30 * MILLIS_PER_MINUTE,
          duration: MILLIS_PER_HOUR,
        }),
        '4': makeOntimeEvent({
          id: '4',
          timeStart: 9 * MILLIS_PER_HOUR,
          timeEnd: 10 * MILLIS_PER_HOUR,
          duration: MILLIS_PER_HOUR,
        }),
      },
    });

    const initResult = generate(rundown, {});
    expect(initResult.totalDuration).toBe(dayInMs + MILLIS_PER_HOUR); // day + last end - first start
  });

  it('handles negative delays', () => {
    const rundown = makeRundown({
      order: ['1', 'delay', '2', 'block', '3', 'another-block', '4'],
      entries: {
        '1': makeOntimeEvent({ id: '1', timeStart: 100, timeEnd: 200, duration: 100 }),
        delay: makeOntimeDelay({ id: 'delay', duration: -200 }),
        '2': makeOntimeEvent({ id: '2', timeStart: 200, timeEnd: 300, duration: 100 }),
        block: makeOntimeBlock({ id: 'block', title: 'break' }),
        '3': makeOntimeEvent({ id: '3', timeStart: 400, timeEnd: 500, duration: 100 }),
        'another-block': makeOntimeBlock({ id: 'another-block', title: 'another-break' }),
        '4': makeOntimeEvent({ id: '4', timeStart: 600, timeEnd: 700, duration: 100 }),
      },
    });

    const initResult = generate(rundown, {});
    expect(initResult.order.length).toBe(7);
    expect((initResult.entries['1'] as OntimeEvent).delay).toBe(0);
    expect((initResult.entries['2'] as OntimeEvent).delay).toBe(-200);
    expect((initResult.entries['3'] as OntimeEvent).delay).toBe(-200);
    expect((initResult.entries['4'] as OntimeEvent).delay).toBe(-200);
    expect(initResult.totalDelay).toBe(-200);
    expect(initResult.totalDuration).toBe(700 - 100);
  });

  it('links times across events', () => {
    const rundown = makeRundown({
      order: ['1', '2', 'block', 'delay', '3'],
      entries: {
        '1': makeOntimeEvent({
          id: '1',
          timeStart: 1,
          duration: 1,
          timeEnd: 2,
          timeStrategy: TimeStrategy.LockEnd,
        }),
        '2': makeOntimeEvent({
          id: '2',
          timeStart: 11,
          duration: 1,
          timeEnd: 12,
          linkStart: true,
          timeStrategy: TimeStrategy.LockEnd,
        }),
        block: makeOntimeBlock({ id: 'block' }),
        delay: makeOntimeDelay({ id: 'delay' }),
        '3': makeOntimeEvent({
          id: '3',
          timeStart: 21,
          duration: 1,
          timeEnd: 22,
          linkStart: true,
          timeStrategy: TimeStrategy.LockEnd,
        }),
      },
    });

    const initResult = generate(rundown, {});
    expect(initResult.order.length).toBe(5);
    expect((initResult.entries['2'] as OntimeEvent).timeStart).toBe(2);
    expect((initResult.entries['2'] as OntimeEvent).timeEnd).toBe(12);
    expect((initResult.entries['2'] as OntimeEvent).duration).toBe(10);

    expect((initResult.entries['3'] as OntimeEvent).timeStart).toBe(12);
    expect((initResult.entries['3'] as OntimeEvent).timeEnd).toBe(22);
    expect((initResult.entries['3'] as OntimeEvent).duration).toBe(10);
  });

  it('links times across events, reordered', () => {
    const rundown = makeRundown({
      order: ['1', '3', '2'],
      entries: {
        '1': makeOntimeEvent({ id: '1', timeStart: 1, timeEnd: 2 }),
        '3': makeOntimeEvent({ id: '3', timeStart: 21, timeEnd: 22, linkStart: true }),
        '2': makeOntimeEvent({ id: '2', timeStart: 11, timeEnd: 12, linkStart: true }),
      },
    });

    const initResult = generate(rundown, {});
    expect(initResult.order.length).toBe(3);
    expect((initResult.entries['3'] as OntimeEvent).timeStart).toBe(2);
  });

  it('calculates total duration', () => {
    const rundown = makeRundown({
      order: ['1', '2', 'skipped', '3'],
      entries: {
        '1': makeOntimeEvent({ id: '1', timeStart: 100, timeEnd: 200, duration: 100 }),
        '2': makeOntimeEvent({ id: '2', timeStart: 200, timeEnd: 300, duration: 100 }),
        skipped: makeOntimeEvent({ id: 'skipped', skip: true, timeStart: 300, timeEnd: 400, duration: 100 }),
        '3': makeOntimeEvent({ id: '2', timeStart: 400, timeEnd: 500, duration: 100 }),
      },
    });

    const initResult = generate(rundown, {});
    expect(initResult.order.length).toBe(4);
    expect(initResult.totalDuration).toBe(500 - 100);
  });

  it('calculates total duration with 0 duration events without causing a next day', () => {
    const rundown = makeRundown({
      order: ['1', '2', 'skipped', '3'],
      entries: {
        '1': makeOntimeEvent({ id: '1', timeStart: 100, timeEnd: 100, duration: 0 }),
        '2': makeOntimeEvent({ id: '2', timeStart: 100, timeEnd: 300, duration: 200 }),
        skipped: makeOntimeEvent({ id: 'skipped', skip: true, timeStart: 300, timeEnd: 400, duration: 0 }),
        '3': makeOntimeEvent({ id: '2', timeStart: 400, timeEnd: 500, duration: 100 }),
      },
    });

    const initResult = generate(rundown, {});
    expect(initResult.order.length).toBe(4);
    expect(initResult.totalDuration).toBe(500 - 100);
  });

  it('calculates total duration across days with gap', () => {
    const rundown = makeRundown({
      order: ['1', '2', '3'],
      entries: {
        '1': makeOntimeEvent({
          id: '1',
          timeStart: 9 * MILLIS_PER_HOUR,
          timeEnd: 23 * MILLIS_PER_HOUR,
          duration: (23 - 9) * MILLIS_PER_HOUR,
        }),
        '2': makeOntimeEvent({
          id: '2',
          timeStart: 9 * MILLIS_PER_HOUR,
          timeEnd: 23 * MILLIS_PER_HOUR,
          duration: (23 - 9) * MILLIS_PER_HOUR,
        }),
        '3': makeOntimeEvent({
          id: '2',
          timeStart: 9 * MILLIS_PER_HOUR,
          timeEnd: 23 * MILLIS_PER_HOUR,
          duration: (23 - 9) * MILLIS_PER_HOUR,
        }),
      },
    });

    const initResult = generate(rundown, {});
    expect(initResult.totalDuration).toBe((23 - 9 + 48) * MILLIS_PER_HOUR);
  });

  it('calculates total duration across days', () => {
    const rundown = makeRundown({
      order: ['1', '2'],
      entries: {
        '1': makeOntimeEvent({
          id: '1',
          timeStart: 12 * MILLIS_PER_HOUR,
          timeEnd: 22 * MILLIS_PER_HOUR,
          duration: 10 * MILLIS_PER_HOUR,
        }),
        '2': makeOntimeEvent({
          id: '2',
          timeStart: 22 * MILLIS_PER_HOUR,
          timeEnd: 8 * MILLIS_PER_HOUR,
          duration: (24 - 22 + 8) * MILLIS_PER_HOUR,
        }),
      },
    });

    const initResult = generate(rundown, {});
    const expectedDuration = 8 * MILLIS_PER_HOUR + (dayInMs - 12 * MILLIS_PER_HOUR);
    expect(initResult.totalDuration).toBe(expectedDuration);
  });

  it('handles updating event sequence', () => {
    const rundown = makeRundown({
      order: ['1', '2', '3'],
      entries: {
        '1': makeOntimeEvent({
          id: '1',
          timeStart: 0,
          timeEnd: 600000,
          duration: 600000,
          timeStrategy: TimeStrategy.LockDuration,
          linkStart: false,
        }),
        '2': makeOntimeEvent({
          id: '2',
          timeStart: 600000,
          timeEnd: 601000,
          duration: 85801000, // <------------- value out of sync
          timeStrategy: TimeStrategy.LockEnd,
          linkStart: true,
        }),
        '3': makeOntimeEvent({
          id: '3',
          timeStart: 100, // <------------- value out of sync
          timeEnd: 602000,
          duration: 0,
          timeStrategy: TimeStrategy.LockEnd,
          linkStart: true,
        }),
      },
    });

    const initResult = generate(rundown, {});
    expect(initResult.entries).toMatchObject({
      '1': {
        timeStart: 0,
        timeEnd: 600000,
        duration: 600000,
        timeStrategy: 'lock-duration',
        linkStart: false,
      },
      '2': {
        timeStart: 600000,
        timeEnd: 601000,
        duration: 1000,
        timeStrategy: 'lock-end',
        linkStart: true,
      },
      '3': {
        timeStart: 601000,
        timeEnd: 602000,
        duration: 1000,
        timeStrategy: 'lock-end',
        linkStart: true,
      },
    });
  });

  describe('custom properties feature', () => {
    it('creates a map of custom properties', () => {
      const customProperties: CustomFields = {
        lighting: {
          label: 'lighting',
          type: 'string',
          colour: 'red',
        },
        sound: {
          label: 'sound',
          type: 'string',
          colour: 'red',
        },
      };

      const rundown = makeRundown({
        order: ['1', '2'],
        entries: {
          '1': makeOntimeEvent({
            id: '1',
            custom: {
              lighting: 'event 1 lx',
            },
          }),
          '2': makeOntimeEvent({
            id: '2',
            custom: {
              lighting: 'event 2 lx',
              sound: 'event 2 sound',
            },
          }),
        },
      });
      const initResult = generate(rundown, customProperties);
      expect(initResult.order.length).toBe(2);
      expect(initResult.assignedCustomFields).toMatchObject({
        lighting: ['1', '2'],
        sound: ['2'],
      });
      expect((initResult.entries['1'] as OntimeEvent).custom).toMatchObject({ lighting: 'event 1 lx' });
      expect((initResult.entries['2'] as OntimeEvent).custom).toMatchObject({
        lighting: 'event 2 lx',
        sound: 'event 2 sound',
      });
    });
  });
});

describe('generate() v4', () => {
  describe('handle of event groups', () => {
    it('correctly parses group metadata', () => {
      const rundown = makeRundown({
        order: ['1'],
        entries: {
          '1': makeOntimeBlock({ id: '1', events: ['100', '200', '300'] }),
          '100': makeOntimeEvent({ id: '100', timeStart: 100, timeEnd: 200, duration: 100, linkStart: false }),
          '200': makeOntimeEvent({ id: '200', timeStart: 200, timeEnd: 300, duration: 100 }),
          '300': makeOntimeEvent({ id: '300', timeStart: 300, timeEnd: 400, duration: 100 }),
        },
      });
      const generatedRundown = generate(rundown, {});

      expect(generatedRundown.order).toMatchObject(['1']);
      expect(generatedRundown.totalDuration).toBe(300);
      expect(generatedRundown.totalDelay).toBe(0);
      expect(generatedRundown.entries).toMatchObject({
        '1': {
          type: SupportedEntry.Block,
          events: ['100', '200', '300'],
          startTime: 100,
          endTime: 400,
          duration: 300,
          isFirstLinked: false,
          numEvents: 3,
        },
        '100': { type: SupportedEntry.Event, parent: '1' },
        '200': { type: SupportedEntry.Event, parent: '1' },
        '300': { type: SupportedEntry.Event, parent: '1' },
      });
    });

    it('treats groups as invisible for gap calculations', () => {
      const rundown = makeRundown({
        order: ['0', '1', '2', '3'],
        entries: {
          '0': makeOntimeEvent({ id: '0', timeStart: 0, timeEnd: 10, duration: 10, linkStart: false }),
          '1': makeOntimeBlock({ id: '1', events: ['101', '102', '103'] }),
          '101': makeOntimeEvent({ id: '101', timeStart: 100, timeEnd: 200, duration: 100, linkStart: false }),
          '102': makeOntimeEvent({ id: '102', timeStart: 200, timeEnd: 300, duration: 100, linkStart: true }),
          '103': makeOntimeEvent({ id: '103', timeStart: 300, timeEnd: 400, duration: 100, linkStart: true }),
          '2': makeOntimeBlock({ id: '2', events: ['201', '202', '203'] }),
          '201': makeOntimeEvent({ id: '201', timeStart: 500, timeEnd: 600, duration: 100, linkStart: false }),
          '202': makeOntimeEvent({ id: '202', timeStart: 600, timeEnd: 700, duration: 100, linkStart: true }),
          '203': makeOntimeEvent({ id: '203', timeStart: 700, timeEnd: 800, duration: 100, linkStart: true }),
          '3': makeOntimeBlock({ id: '3', events: ['301', '302', '303'] }),
          '301': makeOntimeEvent({ id: '301', timeStart: 900, timeEnd: 1000, duration: 100, linkStart: false }),
          '302': makeOntimeEvent({ id: '302', timeStart: 1000, timeEnd: 1100, duration: 100, linkStart: true }),
          '303': makeOntimeEvent({ id: '303', timeStart: 1100, timeEnd: 1200, duration: 100, linkStart: true }),
        },
      });
      const generatedRundown = generate(rundown, {});

      expect(generatedRundown.order).toMatchObject(['0', '1', '2', '3']);
      expect(generatedRundown.totalDuration).toBe(1200);
      expect(generatedRundown.totalDelay).toBe(0);
      expect(generatedRundown.entries).toMatchObject({
        '0': { type: SupportedEntry.Event, parent: null },
        '1': {
          type: SupportedEntry.Block,
          events: ['101', '102', '103'],
          startTime: 100,
          endTime: 400,
          duration: 300,
          isFirstLinked: false,
          numEvents: 3,
        },
        '101': { parent: '1', gap: 90, linkStart: false },
        '102': { parent: '1' },
        '103': { parent: '1' },
        '2': {
          type: SupportedEntry.Block,
          events: ['201', '202', '203'],
          startTime: 500,
          endTime: 800,
          duration: 300,
          isFirstLinked: false,
          numEvents: 3,
        },
        '201': { id: '201', timeStart: 500, timeEnd: 600, duration: 100, gap: 100, linkStart: false },
        '202': { id: '202', timeStart: 600, timeEnd: 700, duration: 100 },
        '203': { id: '203', timeStart: 700, timeEnd: 800, duration: 100 },
        '3': {
          type: SupportedEntry.Block,
          events: ['301', '302', '303'],
          startTime: 900,
          endTime: 1200,
          duration: 300,
          isFirstLinked: false,
          numEvents: 3,
        },
        '301': { id: '301', timeStart: 900, timeEnd: 1000, duration: 100, gap: 100, linkStart: false },
        '302': { id: '302', timeStart: 1000, timeEnd: 1100, duration: 100 },
        '303': { id: '303', timeStart: 1100, timeEnd: 1200, duration: 100 },
      });
    });
  });
});

describe('add() mutation', () => {
  test('adds an event to the rundown', () => {
    const mockEvent = makeOntimeEvent({ id: 'mock', cue: 'mock' });
    const rundown = makeRundown({});
    const { newRundown } = add({ atIndex: 0, entry: mockEvent, parent: null, rundown });
    expect(newRundown.order.length).toBe(1);
    expect(newRundown.entries['mock']).toMatchObject(mockEvent);
  });
});

describe('remove() mutation', () => {
  test('deletes an event from the rundown', () => {
    const mockEvent = makeOntimeEvent({ id: 'mock', cue: 'mock' });
    const rundown = makeRundown({
      order: ['mock'],
      entries: {
        mock: mockEvent,
      },
    });

    const { newRundown } = remove({ eventIds: [mockEvent.id], rundown });
    expect(newRundown.order.length).toBe(0);
  });

  test('deletes multiple events from the rundown', () => {
    const rundown = makeRundown({
      order: ['1', '2', '3', '4', '5', '6'],
      entries: {
        '1': makeOntimeEvent({ id: '1' }),
        '2': makeOntimeBlock({ id: '2' }),
        '3': makeOntimeDelay({ id: '3' }),
        '4': makeOntimeEvent({ id: '4' }),
        '5': makeOntimeEvent({ id: '5' }),
        '6': makeOntimeEvent({ id: '6' }),
      },
    });

    const { newRundown } = remove({ eventIds: ['1', '2', '3'], rundown });
    expect(newRundown.order.length).toBe(3);
    expect(newRundown.entries[newRundown.order[0]].id).toBe('4');
  });
});

describe('edit() mutation', () => {
  test('edits an event in the rundown', () => {
    const mockEvent = makeOntimeEvent({ id: 'mock', cue: 'mock' });
    const mockEventPatch = makeOntimeEvent({ cue: 'patched' });
    const rundown = makeRundown({
      order: ['mock'],
      entries: {
        mock: mockEvent,
      },
    });

    const { newRundown, newEvent } = edit({
      eventId: mockEvent.id,
      patch: mockEventPatch,
      rundown,
    });
    expect(newRundown.order.length).toBe(1);
    expect(newEvent).toMatchObject({
      id: 'mock',
      cue: 'patched',
      type: SupportedEntry.Event,
    });
  });
});

describe('batchEdit() mutation', () => {
  it('should correctly apply the patch to the events with the given IDs', () => {
    const rundown = makeRundown({
      order: ['1', '2', '3'],
      entries: {
        '1': makeOntimeEvent({ id: '1', cue: 'data1' }),
        '2': makeOntimeEvent({ id: '2', cue: 'data2' }),
        '3': makeOntimeEvent({ id: '3', cue: 'data3' }),
      },
    });

    const eventIds = ['1', '3'];
    const patch = { cue: 'newData' };

    const { newRundown } = batchEdit({ rundown, eventIds, patch });

    expect(newRundown.entries).toMatchObject({
      '1': { id: '1', type: SupportedEntry.Event, cue: 'newData' },
      '2': { id: '2', type: SupportedEntry.Event, cue: 'data2' },
      '3': { id: '3', type: SupportedEntry.Event, cue: 'newData' },
    });
  });
});

describe('reorder() mutation', () => {
  it('should correctly reorder two events', () => {
    const rundown = makeRundown({
      order: ['1', '2', '3'],
      entries: {
        '1': makeOntimeEvent({ id: '1', cue: 'data1', revision: 0 }),
        '2': makeOntimeEvent({ id: '2', cue: 'data2', revision: 0 }),
        '3': makeOntimeEvent({ id: '3', cue: 'data3', revision: 0 }),
      },
    });

    // move first event to the end
    const { newRundown } = reorder({
      rundown: rundown,
      eventId: rundown.order[0],
      from: 0,
      to: rundown.order.length - 1,
    });

    expect(newRundown.order).toStrictEqual(['2', '3', '1']);
    expect(newRundown.entries).toMatchObject({
      '2': { id: '2', cue: 'data2', revision: 1 },
      '3': { id: '3', cue: 'data3', revision: 1 },
      '1': { id: '1', cue: 'data1', revision: 1 },
    });
  });
});

describe('swap() mutation', () => {
  it('should correctly swap data between events', () => {
    const rundown = makeRundown({
      order: ['1', '2', '3'],
      entries: {
        '1': makeOntimeEvent({ id: '1', cue: 'data1', timeStart: 1, revision: 4 }),
        '2': makeOntimeEvent({ id: '2', cue: 'data2', timeStart: 2, revision: 8 }),
        '3': makeOntimeEvent({ id: '3', cue: 'data3', timeStart: 3, revision: 12 }),
      },
    });

    // swap first and second event
    const { newRundown } = swap({
      rundown: rundown,
      fromId: rundown.order[0],
      toId: rundown.order[1],
    });

    expect(newRundown.order).toStrictEqual(['1', '2', '3']);

    expect(newRundown.entries['1']).toMatchObject({
      id: '1',
      cue: 'data2',
      timeStart: 1,
      revision: 5,
    });

    expect(newRundown.entries['2']).toMatchObject({
      id: '2',
      cue: 'data1',
      timeStart: 2,
      revision: 9,
    });

    expect(newRundown.entries['3']).toMatchObject({
      id: '3',
      cue: 'data3',
      timeStart: 3,
      revision: 12,
    });
  });
});

describe('custom fields flow', () => {
  describe('createCustomField()', () => {
    it('creates a field from given parameters', () => {
      const expected = {
        Lighting: {
          label: 'Lighting',
          type: 'string',
          colour: 'blue',
        },
      };

      const customField = createCustomField({ label: 'Lighting', type: 'string', colour: 'blue' });
      expect(customField).toStrictEqual(expected);
    });
  });

  describe('editCustomField()', () => {
    it('edits a field with a given label', () => {
      createCustomField({ label: 'Sound', type: 'string', colour: 'blue' });

      const expected = {
        Lighting: {
          label: 'Lighting',
          type: 'string',
          colour: 'blue',
        },
        Sound: {
          label: 'Sound',
          type: 'string',
          colour: 'green',
        },
      };

      const customField = editCustomField('Sound', { label: 'Sound', type: 'string', colour: 'green' });
      expect(customFieldChangelog).toStrictEqual({});
      expect(customField).toStrictEqual(expected);
    });

    it('renames a field to a new label', () => {
      const created = createCustomField({ label: 'Video', type: 'string', colour: 'red' });

      const expected = {
        Lighting: {
          label: 'Lighting',
          type: 'string',
          colour: 'blue',
        },
        Sound: {
          label: 'Sound',
          type: 'string',
          colour: 'green',
        },
        Video: {
          label: 'Video',
          type: 'string',
          colour: 'red',
        },
      };

      expect(created).toStrictEqual(expected);

      const expectedAfter = {
        Lighting: {
          label: 'Lighting',
          type: 'string',
          colour: 'blue',
        },
        Sound: {
          label: 'Sound',
          type: 'string',
          colour: 'green',
        },
        AV: {
          label: 'AV',
          type: 'string',
          colour: 'red',
        },
      };

      // We need to flush all scheduled tasks for the generate function to settle
      vi.useFakeTimers();
      const customField = editCustomField('Video', { label: 'AV', type: 'string', colour: 'red' });
      expect(customField).toStrictEqual(expectedAfter);
      expect(customFieldChangelog).toStrictEqual({ Video: 'AV' });
      editCustomField('AV', { label: 'Video' });
      vi.runAllTimers();
      expect(customFieldChangelog).toStrictEqual({});
      vi.useRealTimers();
    });
  });

  describe('removeCustomField()', () => {
    it('deletes a field with a given label', () => {
      const expected = {
        Lighting: {
          label: 'Lighting',
          type: 'string',
          colour: 'blue',
        },
        Video: {
          label: 'Video',
          type: 'string',
          colour: 'red',
        },
      };

      const customField = removeCustomField('Sound');

      expect(customField).toStrictEqual(expected);
    });
  });
});
