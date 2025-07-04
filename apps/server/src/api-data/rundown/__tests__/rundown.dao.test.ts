import { CustomFields, OntimeBlock, OntimeDelay, OntimeEvent, SupportedEntry, TimeStrategy } from 'ontime-types';
import { dayInMs, MILLIS_PER_HOUR, MILLIS_PER_MINUTE } from 'ontime-utils';

import {
  makeOntimeEvent,
  makeRundown,
  makeOntimeBlock,
  makeOntimeDelay,
  makeCustomField,
} from '../__mocks__/rundown.mocks.js';

import {
  createTransaction,
  customFieldMutation,
  processRundown,
  rundownCache,
  rundownMutation,
} from '../rundown.dao.js';
import { demoDb } from '../../../models/demoProject.js';
import type { AssignedMap } from '../rundown.types.js';
import { type ProcessedRundownMetadata } from '../rundown.parser.js';

const setRundownMock = vi.fn();
const setCustomFieldsMock = vi.fn();

beforeAll(() => {
  vi.mock('../../../classes/data-provider/DataProvider.js', () => {
    return {
      getDataProvider: vi.fn().mockImplementation(() => {
        return {
          setRundown: setRundownMock,
          setCustomFields: setCustomFieldsMock,
        };
      }),
    };
  });
});

afterAll(() => {
  vi.clearAllMocks();
});

describe('createTransaction', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('should return a snapshot of the cached data and an commit function', () => {
    const { rundown, customFields, commit } = createTransaction({ mutableRundown: true, mutableCustomFields: true });
    expect(rundown).toBeDefined();
    expect(customFields).toBeDefined();
    expect(typeof commit).toBe('function');
  });

  it('should return the updated data after commit is called and writes are scheduled', () => {
    const { rundown, customFields, commit } = createTransaction({ mutableRundown: true, mutableCustomFields: true });
    rundown.title = 'Another Title';
    customFields['newField'] = {
      label: 'New Field',
      type: 'string',
      colour: 'blue',
    };

    const updated = commit();
    vi.runAllTimers();

    expect(updated.rundown.title).toBe('Another Title');
    expect(updated.customFields).toHaveProperty('newField');

    expect(setRundownMock).toHaveBeenCalledOnce();
    expect(setCustomFieldsMock).toHaveBeenCalledOnce();
  });
});

describe('processRundown()', () => {
  test('benchmark function execution time', () => {
    const t1 = performance.now();
    let result: ProcessedRundownMetadata | null = null;
    for (let i = 0; i < 100; i++) {
      result = processRundown(demoDb.rundowns.default, demoDb.customFields);
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
    const initResult = processRundown(demoDb.rundowns.default, demoDb.customFields);

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

    const initResult = processRundown(rundown, {});
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

    const initResult = processRundown(rundown, {});
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

    const initResult = processRundown(rundown, {});
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

    const initResult = processRundown(rundown, {});
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

    const initResult = processRundown(rundown, {});
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
      },
    });

    const initResult = processRundown(rundown, {});
    expect(initResult.totalDuration).toBe(1 * MILLIS_PER_HOUR + 30 * MILLIS_PER_MINUTE); // day + last end - first start
  });

  it('maintains delays over gaps', () => {
    const rundown = makeRundown({
      order: ['1', 'delay', '2'],
      entries: {
        '1': makeOntimeEvent({ id: '1', timeStart: 0, timeEnd: 100, duration: 100 }),
        delay: makeOntimeDelay({ id: 'delay', duration: 500 }),
        '2': makeOntimeEvent({ id: '2', timeStart: 500, timeEnd: 600, duration: 100 }),
      },
    });

    const initResult = processRundown(rundown, {});
    expect(initResult.entries['2']).toMatchObject({
      gap: 400,
      delay: 500,
    });
    expect(initResult.totalDelay).toBe(500);
    expect(initResult.totalDuration).toBe(600);
  });

  it('maintains delays over gaps when there are cumulative delays', () => {
    const rundown = makeRundown({
      order: ['delay1', '1', 'delay2', '2'],
      entries: {
        delay1: makeOntimeDelay({ id: 'delay', duration: 100 }),
        '1': makeOntimeEvent({ id: '1', timeStart: 0, timeEnd: 100, duration: 100 }),
        delay2: makeOntimeDelay({ id: 'delay', duration: 300 }),
        '2': makeOntimeEvent({ id: '2', timeStart: 300, timeEnd: 400, duration: 100 }),
      },
    });

    const initResult = processRundown(rundown, {});
    expect(initResult.entries['1']).toMatchObject({
      gap: 0,
      delay: 100,
    });
    expect(initResult.entries['2']).toMatchObject({
      gap: 200,
      delay: 300, // first delay was fully absorbed
    });
    expect(initResult.totalDelay).toBe(300);
    expect(initResult.totalDuration).toBe(400);
  });

  it('handles negative delays on gaps', () => {
    const rundown = makeRundown({
      order: ['delay1', '1', 'delay2', '2'],
      entries: {
        delay1: makeOntimeDelay({ id: 'delay', duration: -100 }),
        '1': makeOntimeEvent({ id: '1', timeStart: 0, timeEnd: 100, duration: 100 }),
        delay2: makeOntimeDelay({ id: 'delay', duration: -300 }),
        '2': makeOntimeEvent({ id: '2', timeStart: 300, timeEnd: 400, duration: 100 }),
      },
    });

    const initResult = processRundown(rundown, {});
    expect(initResult.entries['1']).toMatchObject({
      gap: 0,
      delay: -100,
    });
    expect(initResult.entries['2']).toMatchObject({
      gap: 200,
      delay: -400,
    });
    expect(initResult.totalDelay).toBe(-400);
    expect(initResult.totalDuration).toBe(400);
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

    const initResult = processRundown(rundown, {});
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

    const initResult = processRundown(rundown, {});
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

    const initResult = processRundown(rundown, {});
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

    const initResult = processRundown(rundown, {});
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

    const initResult = processRundown(rundown, {});
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
          id: '3',
          timeStart: 9 * MILLIS_PER_HOUR,
          timeEnd: 23 * MILLIS_PER_HOUR,
          duration: (23 - 9) * MILLIS_PER_HOUR,
        }),
      },
    });

    const initResult = processRundown(rundown, {});
    expect(initResult.totalDuration).toBe((23 - 9) * MILLIS_PER_HOUR);
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

    const initResult = processRundown(rundown, {});
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

    const initResult = processRundown(rundown, {});
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
      const initResult = processRundown(rundown, customProperties);
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
  describe('handle of event groups', () => {
    it('correctly parses group metadata', () => {
      const rundown = makeRundown({
        order: ['1'],
        entries: {
          '1': makeOntimeBlock({ id: '1', entries: ['100', '200', '300'] }),
          '100': makeOntimeEvent({ id: '100', timeStart: 100, timeEnd: 200, duration: 100, linkStart: false }),
          '200': makeOntimeEvent({ id: '200', timeStart: 200, timeEnd: 300, duration: 100 }),
          '300': makeOntimeEvent({ id: '300', timeStart: 300, timeEnd: 400, duration: 100 }),
        },
      });
      const generatedRundown = processRundown(rundown, {});

      expect(generatedRundown.order).toMatchObject(['1']);
      expect(generatedRundown.totalDuration).toBe(300);
      expect(generatedRundown.totalDelay).toBe(0);
      expect(generatedRundown.entries).toMatchObject({
        '1': {
          type: SupportedEntry.Block,
          entries: ['100', '200', '300'],
          timeStart: 100,
          timeEnd: 400,
          duration: 300,
          isFirstLinked: false,
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
          '1': makeOntimeBlock({ id: '1', entries: ['101', '102', '103'] }),
          '101': makeOntimeEvent({ id: '101', timeStart: 100, timeEnd: 200, duration: 100, linkStart: false }),
          '102': makeOntimeEvent({ id: '102', timeStart: 200, timeEnd: 300, duration: 100, linkStart: true }),
          '103': makeOntimeEvent({ id: '103', timeStart: 300, timeEnd: 400, duration: 100, linkStart: true }),
          '2': makeOntimeBlock({ id: '2', entries: ['201', '202', '203'] }),
          '201': makeOntimeEvent({ id: '201', timeStart: 500, timeEnd: 600, duration: 100, linkStart: false }),
          '202': makeOntimeEvent({ id: '202', timeStart: 600, timeEnd: 700, duration: 100, linkStart: true }),
          '203': makeOntimeEvent({ id: '203', timeStart: 700, timeEnd: 800, duration: 100, linkStart: true }),
          '3': makeOntimeBlock({ id: '3', entries: ['301', '302', '303'] }),
          '301': makeOntimeEvent({ id: '301', timeStart: 900, timeEnd: 1000, duration: 100, linkStart: false }),
          '302': makeOntimeEvent({ id: '302', timeStart: 1000, timeEnd: 1100, duration: 100, linkStart: true }),
          '303': makeOntimeEvent({ id: '303', timeStart: 1100, timeEnd: 1200, duration: 100, linkStart: true }),
        },
      });
      const generatedRundown = processRundown(rundown, {});

      expect(generatedRundown.order).toMatchObject(['0', '1', '2', '3']);
      expect(generatedRundown.totalDuration).toBe(1200);
      expect(generatedRundown.totalDelay).toBe(0);
      expect(generatedRundown.entries).toMatchObject({
        '0': { type: SupportedEntry.Event, parent: null },
        '1': {
          type: SupportedEntry.Block,
          entries: ['101', '102', '103'],
          timeStart: 100,
          timeEnd: 400,
          duration: 300,
          isFirstLinked: false,
        },
        '101': { parent: '1', gap: 90, linkStart: false },
        '102': { parent: '1' },
        '103': { parent: '1' },
        '2': {
          type: SupportedEntry.Block,
          entries: ['201', '202', '203'],
          timeStart: 500,
          timeEnd: 800,
          duration: 300,
          isFirstLinked: false,
        },
        '201': { id: '201', timeStart: 500, timeEnd: 600, duration: 100, gap: 100, linkStart: false },
        '202': { id: '202', timeStart: 600, timeEnd: 700, duration: 100 },
        '203': { id: '203', timeStart: 700, timeEnd: 800, duration: 100 },
        '3': {
          type: SupportedEntry.Block,
          entries: ['301', '302', '303'],
          timeStart: 900,
          timeEnd: 1200,
          duration: 300,
          isFirstLinked: false,
        },
        '301': { id: '301', timeStart: 900, timeEnd: 1000, duration: 100, gap: 100, linkStart: false },
        '302': { id: '302', timeStart: 1000, timeEnd: 1100, duration: 100 },
        '303': { id: '303', timeStart: 1100, timeEnd: 1200, duration: 100 },
      });
    });
  });
});

describe('rundownMutation.add()', () => {
  test('adds an event an empty rundown', () => {
    const mockEvent = makeOntimeEvent({ id: 'mock', cue: 'mock' });
    const rundown = makeRundown({});

    rundownMutation.add(rundown, mockEvent, null, null);

    expect(rundown.order.length).toBe(1);
    expect(rundown.entries['mock']).toMatchObject(mockEvent);
  });

  test('adds an event at the top if no afterId is given', () => {
    const mockEvent = makeOntimeEvent({ id: 'mock', cue: 'mock' });
    const rundown = makeRundown({
      flatOrder: ['1'],
      order: ['1'],
      entries: {
        '1': makeOntimeEvent({ id: '1', cue: '1' }),
      },
    });

    rundownMutation.add(rundown, mockEvent, null, null);

    expect(rundown.order).toStrictEqual(['mock', '1']);
    expect(rundown.flatOrder).toStrictEqual(['mock', '1']);
    expect(rundown.entries['mock']).toMatchObject(mockEvent);
  });

  test('adds an event at the top of the block if no after is given', () => {
    const mockEvent = makeOntimeEvent({ id: 'mock', cue: 'mock' });
    const rundown = makeRundown({
      flatOrder: ['1', '1a'],
      order: ['1'],
      entries: {
        '1': makeOntimeBlock({ id: '1' }),
        '1a': makeOntimeEvent({ id: '1a', parent: '1' }),
      },
    });

    rundownMutation.add(rundown, mockEvent, null, rundown.entries['1'] as OntimeBlock);

    expect(rundown.order).toStrictEqual(['1']);
    expect(rundown.flatOrder).toStrictEqual(['1', 'mock', '1a']);
    expect(rundown.entries['mock']).toMatchObject(mockEvent);
  });

  test('adds an event at the a given location inside a block', () => {
    const mockEvent = makeOntimeEvent({ id: 'mock', cue: 'mock' });
    const rundown = makeRundown({
      flatOrder: ['1', '1a'],
      order: ['1'],
      entries: {
        '1': makeOntimeBlock({ id: '1' }),
        '1a': makeOntimeEvent({ id: '1a', parent: '1' }),
      },
    });

    rundownMutation.add(rundown, mockEvent, '1a', rundown.entries['1'] as OntimeBlock);

    expect(rundown.order).toStrictEqual(['1']);
    expect(rundown.flatOrder).toStrictEqual(['1', '1a', 'mock']);
    expect(rundown.entries['mock']).toMatchObject(mockEvent);
  });
});

describe('rundownMutation.edit()', () => {
  test('edits an event in the rundown', () => {
    const mockEvent = makeOntimeEvent({ id: 'mock', cue: 'mock' });
    const mockEventPatch = { id: 'mock', cue: 'patched' };
    const rundown = makeRundown({
      order: ['mock'],
      entries: {
        mock: mockEvent,
      },
    });

    const { entry, didInvalidate } = rundownMutation.edit(rundown, mockEventPatch);

    expect(rundown.order.length).toBe(1);
    expect(didInvalidate).toBeFalsy();
    expect(entry).toMatchObject({
      id: 'mock',
      cue: 'patched',
      type: SupportedEntry.Event,
    });
  });

  test('changing time fields invalidates the rundown', () => {
    const rundown = makeRundown({
      order: ['delay', 'event'],
      entries: {
        delay: makeOntimeDelay({ id: 'delay' }),
        event: makeOntimeEvent({ id: 'event' }),
      },
    });

    expect(rundownMutation.edit(rundown, { id: 'delay', duration: 1000 }).didInvalidate).toBeTruthy();

    expect(rundownMutation.edit(rundown, { id: 'event', timeStart: 1000 }).didInvalidate).toBeTruthy();
    expect(rundownMutation.edit(rundown, { id: 'event', timeEnd: 1000 }).didInvalidate).toBeTruthy();
    expect(rundownMutation.edit(rundown, { id: 'event', duration: 1000 }).didInvalidate).toBeTruthy();
    expect(rundownMutation.edit(rundown, { id: 'event', linkStart: true }).didInvalidate).toBeTruthy();
    expect(rundownMutation.edit(rundown, { id: 'event', linkStart: false }).didInvalidate).toBeTruthy();
  });
});

describe('rundownMutation.remove()', () => {
  it('deletes an event from the rundown', () => {
    const rundown = makeRundown({
      order: ['1', '2', '3'],
      entries: {
        '1': makeOntimeEvent({ id: '1', cue: 'mock' }),
        '2': makeOntimeEvent({ id: '2', cue: 'mock' }),
        '3': makeOntimeEvent({ id: '3', cue: 'mock' }),
      },
    });

    rundownMutation.remove(rundown, rundown.entries['2']);

    expect(rundown.order).toStrictEqual(['1', '3']);
    expect(rundown.entries['1']).not.toBeUndefined();
    expect(rundown.entries['2']).toBeUndefined();
    expect(rundown.entries['3']).not.toBeUndefined();
  });

  it('deletes a block and its children', () => {
    const rundown = makeRundown({
      order: ['1', '4'],
      entries: {
        '1': makeOntimeBlock({ id: '1', entries: ['2', '3'] }),
        '2': makeOntimeEvent({ id: '2', parent: '1' }),
        '3': makeOntimeDelay({ id: '3', parent: '1' }),
        '4': makeOntimeEvent({ id: '4', parent: null }),
      },
    });

    rundownMutation.remove(rundown, rundown.entries['1']);

    expect(rundown.order).toStrictEqual(['4']);
    expect(rundown.entries).not.toHaveProperty('1');
    expect(rundown.entries).not.toHaveProperty('2');
    expect(rundown.entries).not.toHaveProperty('3');
    expect(rundown.entries['4']).toMatchObject({
      parent: null,
    });
  });

  it('deletes a nested event and its reference in the parent', () => {
    const rundown = makeRundown({
      order: ['1', '4'],
      entries: {
        '1': makeOntimeBlock({ id: '1', entries: ['2', '3'] }),
        '2': makeOntimeEvent({ id: '2', parent: '1' }),
        '3': makeOntimeDelay({ id: '3', parent: '1' }),
        '4': makeOntimeEvent({ id: '4', parent: null }),
      },
    });

    rundownMutation.remove(rundown, rundown.entries['2']);

    expect(rundown.order).toStrictEqual(['1', '4']);
    expect(rundown.entries).not.toHaveProperty('2');
    expect(rundown.entries['1']).toMatchObject({
      entries: ['3'],
    });
  });
});

describe('rundownMutation.removeAll()', () => {
  test('deletes all events from the rundown', () => {
    const rundown = makeRundown({
      order: ['1', '2', '3'],
      entries: {
        '1': makeOntimeEvent({ id: '1', cue: 'mock' }),
        '2': makeOntimeEvent({ id: '2', cue: 'mock' }),
        '3': makeOntimeEvent({ id: '3', cue: 'mock' }),
      },
    });

    rundownMutation.removeAll(rundown);

    expect(rundown.order).toStrictEqual([]);
    expect(rundown.entries['1']).toBeUndefined();
    expect(rundown.entries['2']).toBeUndefined();
    expect(rundown.entries['3']).toBeUndefined();
  });
});

describe('rundownMutation.reorder()', () => {
  it('moves an event into a block', () => {
    const rundown = makeRundown({
      order: ['1', '2', '3'],
      entries: {
        '1': makeOntimeBlock({ id: '1', entries: [] }),
        '2': makeOntimeEvent({ id: '2', parent: null }),
        '3': makeOntimeEvent({ id: '3', parent: null }),
      },
    });

    rundownMutation.reorder(rundown, rundown.entries['3'], rundown.entries['1'], 'insert');

    expect(rundown.order).toStrictEqual(['1', '2']);
    expect(rundown.entries['1']).toMatchObject({
      entries: ['3'],
    });
    expect(rundown.entries['3']).toMatchObject({
      parent: '1',
    });
  });

  it('adds an event into a block', () => {
    const rundown = makeRundown({
      order: ['1', '2'],
      flatOrder: ['1', '11', '2'],
      entries: {
        '1': makeOntimeBlock({ id: '1', entries: ['11'] }),
        '11': makeOntimeEvent({ id: '11', parent: '1' }),
        '2': makeOntimeEvent({ id: '2', parent: null }),
      },
    });

    rundownMutation.reorder(rundown, rundown.entries['2'], rundown.entries['11'], 'before');

    expect(rundown.order).toStrictEqual(['1']);
    expect(rundown.entries['1']).toMatchObject({
      entries: ['2', '11'],
    });
    expect(rundown.entries['2']).toMatchObject({
      parent: '1',
    });
  });

  it('moves an event after another', () => {
    const rundown = makeRundown({
      order: ['1', '2', '3'],
      flatOrder: ['1', '2', '3'],
      entries: {
        '1': makeOntimeEvent({ id: '1', cue: 'data1' }),
        '2': makeOntimeEvent({ id: '2', cue: 'data2' }),
        '3': makeOntimeEvent({ id: '3', cue: 'data3' }),
      },
    });

    // move first event to the end
    rundownMutation.reorder(rundown, rundown.entries['1'], rundown.entries['2'], 'after');

    expect(rundown.order).toStrictEqual(['2', '1', '3']);
  });

  it('moves an event before another', () => {
    const rundown = makeRundown({
      order: ['1', '2', '3'],
      flatOrder: ['1', '2', '3'],
      entries: {
        '1': makeOntimeEvent({ id: '1', cue: 'data1' }),
        '2': makeOntimeEvent({ id: '2', cue: 'data2' }),
        '3': makeOntimeEvent({ id: '3', cue: 'data3' }),
      },
    });

    // move last event to the beginning
    rundownMutation.reorder(rundown, rundown.entries['3'], rundown.entries['1'], 'before');

    expect(rundown.order).toStrictEqual(['3', '1', '2']);
  });

  it('moves an event out and before a block', () => {
    const rundown = makeRundown({
      order: ['1', '2'],
      flatOrder: ['1', '11', '2'],
      entries: {
        '1': makeOntimeBlock({ id: '1', entries: ['11'] }),
        '11': makeOntimeEvent({ id: '11', parent: '1' }),
        '2': makeOntimeEvent({ id: '2', parent: null }),
      },
    });

    rundownMutation.reorder(rundown, rundown.entries['11'], rundown.entries['2'], 'before');

    expect(rundown.order).toStrictEqual(['1', '11', '2']);
    expect(rundown.entries['1']).toMatchObject({
      entries: [],
    });
    expect(rundown.entries['11']).toMatchObject({
      parent: null,
    });
    expect(rundown.entries['2']).toMatchObject({
      parent: null,
    });
  });

  it('moves an event out and after a block', () => {
    const rundown = makeRundown({
      order: ['1', 'block', '2'],
      flatOrder: ['1', 'block', '11', '2'],
      entries: {
        '1': makeOntimeEvent({ id: '1', parent: null }),
        block: makeOntimeBlock({ id: 'block', entries: ['11'] }),
        '11': makeOntimeEvent({ id: '11', parent: 'block' }),
        '2': makeOntimeEvent({ id: '2', parent: null }),
      },
    });

    rundownMutation.reorder(rundown, rundown.entries['11'], rundown.entries['block'], 'after');

    expect(rundown.order).toStrictEqual(['1', 'block', '11', '2']);
    expect(rundown.entries['block']).toMatchObject({
      entries: [],
    });
    expect(rundown.entries['11']).toMatchObject({
      parent: null,
    });
    expect(rundown.entries['2']).toMatchObject({
      parent: null,
    });
  });

  it('moves an event between blocks', () => {
    const rundown = makeRundown({
      order: ['1', '2'],
      flatOrder: ['1', '11', '2', '22'],
      entries: {
        '1': makeOntimeBlock({ id: '1', entries: ['11'] }),
        '11': makeOntimeEvent({ id: '11', parent: '1' }),
        '2': makeOntimeBlock({ id: '2', entries: ['22'] }),
        '22': makeOntimeEvent({ id: '22', parent: '2' }),
      },
    });

    rundownMutation.reorder(rundown, rundown.entries['11'], rundown.entries['22'], 'before');

    expect(rundown.order).toStrictEqual(['1', '2']);
    expect(rundown.entries['1']).toMatchObject({
      entries: [],
    });
    expect(rundown.entries['2']).toMatchObject({
      entries: ['11', '22'],
    });
    expect(rundown.entries['11']).toMatchObject({
      parent: '2',
    });
  });

  it('moves an event into an empty block', () => {
    const rundown = makeRundown({
      order: ['1', '2'],
      flatOrder: ['1', '2', '22'],
      entries: {
        '1': makeOntimeBlock({ id: '1', entries: [] }),
        '2': makeOntimeBlock({ id: '2', entries: ['22'] }),
        '22': makeOntimeEvent({ id: '22', parent: '2' }),
      },
    });

    rundownMutation.reorder(rundown, rundown.entries['22'], rundown.entries['1'], 'insert');

    expect(rundown.order).toStrictEqual(['1', '2']);
    expect(rundown.entries['1']).toMatchObject({
      entries: ['22'],
    });
    expect(rundown.entries['2']).toMatchObject({
      entries: [],
    });
    expect(rundown.entries['22']).toMatchObject({
      parent: '1',
    });
  });

  it('moves an event out of a block (up)', () => {
    const rundown = makeRundown({
      order: ['1', '2'],
      flatOrder: ['1', '11', '2', '22'],
      entries: {
        '1': makeOntimeBlock({ id: '1', entries: ['11'] }),
        '11': makeOntimeEvent({ id: '11', parent: '1' }),
        '2': makeOntimeBlock({ id: '2', entries: ['22'] }),
        '22': makeOntimeEvent({ id: '22', parent: '2' }),
      },
    });

    rundownMutation.reorder(rundown, rundown.entries['22'], rundown.entries['2'], 'before');

    expect(rundown.order).toStrictEqual(['1', '22', '2']);
    // expect(newRundown.flatOrder).toStrictEqual(['1', '2', '11', '22']);
    // expect(changeList).toStrictEqual(['1', '2', '11', '22']);
    expect(rundown.entries['1']).toMatchObject({
      entries: ['11'],
    });
    expect(rundown.entries['11']).toMatchObject({
      parent: '1',
    });
    expect(rundown.entries['2']).toMatchObject({
      entries: [],
    });
    expect(rundown.entries['22']).toMatchObject({
      parent: null,
    });
  });

  it('moves an event out of a block (down)', () => {
    const rundown = makeRundown({
      order: ['1', '2'],
      flatOrder: ['1', '11', '2', '22'],
      entries: {
        '1': makeOntimeBlock({ id: '1', entries: ['11'] }),
        '11': makeOntimeEvent({ id: '11', parent: '1' }),
        '2': makeOntimeBlock({ id: '2', entries: ['22'] }),
        '22': makeOntimeEvent({ id: '22', parent: '2' }),
      },
    });

    rundownMutation.reorder(rundown, rundown.entries['11'], rundown.entries['1'], 'after');

    expect(rundown.order).toStrictEqual(['1', '11', '2']);
    expect(rundown.entries['1']).toMatchObject({
      entries: [],
    });
    expect(rundown.entries['11']).toMatchObject({
      parent: null,
    });
    expect(rundown.entries['2']).toMatchObject({
      entries: ['22'],
    });
    expect(rundown.entries['22']).toMatchObject({
      parent: '2',
    });
  });

  it('moves a block (up)', () => {
    const rundown = makeRundown({
      order: ['1', '2'],
      flatOrder: ['1', '11', '2', '22'],
      entries: {
        '1': makeOntimeBlock({ id: '1', entries: ['11'] }),
        '11': makeOntimeEvent({ id: '11', parent: '1' }),
        '2': makeOntimeBlock({ id: '2', entries: ['22'] }),
        '22': makeOntimeEvent({ id: '22', parent: '2' }),
      },
    });

    rundownMutation.reorder(rundown, rundown.entries['2'], rundown.entries['1'], 'before');

    expect(rundown.order).toStrictEqual(['2', '1']);
  });

  it('moves a block (down)', () => {
    const rundown = makeRundown({
      order: ['1', '2'],
      flatOrder: ['1', '11', '2', '22'],
      entries: {
        '1': makeOntimeBlock({ id: '1', entries: ['11'] }),
        '11': makeOntimeEvent({ id: '11', parent: '1' }),
        '2': makeOntimeBlock({ id: '2', entries: ['22'] }),
        '22': makeOntimeEvent({ id: '22', parent: '2' }),
      },
    });

    rundownMutation.reorder(rundown, rundown.entries['1'], rundown.entries['2'], 'after');

    expect(rundown.order).toStrictEqual(['2', '1']);
  });
});

describe('rundownMutation.applyDelay()', () => {
  it('applies a positive delay to the rundown', () => {
    const testRundown = makeRundown({
      revision: 0,
      order: ['delay', '1', '2', '3', '4', '5'],
      entries: {
        delay: makeOntimeDelay({ id: 'delay', duration: 10 }),
        '1': makeOntimeEvent({ id: '1', timeStart: 0, timeEnd: 10, duration: 10 }),
        '2': makeOntimeEvent({ id: '2', timeStart: 10, timeEnd: 20, duration: 10, linkStart: true }),
        '3': makeOntimeBlock({ id: '3' }),
        '4': makeOntimeEvent({ id: '4', timeStart: 20, timeEnd: 30, duration: 10, linkStart: false }),
        '5': makeOntimeEvent({ id: '5', timeStart: 30, timeEnd: 40, duration: 10, linkStart: true }),
      },
    });

    rundownCache.init(testRundown, {});
    rundownMutation.applyDelay(testRundown, testRundown.entries['delay'] as OntimeDelay);

    expect(testRundown.entries).toMatchObject({
      '1': { id: '1', timeStart: 10, timeEnd: 20, duration: 10, revision: 2 },
      '2': { id: '2', timeStart: 20, timeEnd: 30, duration: 10, revision: 2, linkStart: true },
      '3': { id: '3' },
      '4': { id: '4', timeStart: 30, timeEnd: 40, duration: 10, revision: 2, linkStart: false },
      '5': { id: '5', timeStart: 40, timeEnd: 50, duration: 10, revision: 2, linkStart: true },
    });
  });

  it('applies negative delays', () => {
    const testRundown = makeRundown({
      revision: 0,
      order: ['delay', '1', '2', '3', '4', '5'],
      entries: {
        delay: makeOntimeDelay({ id: 'delay', duration: -10 }),
        '1': makeOntimeEvent({ id: '1', timeStart: 0, timeEnd: 10, duration: 10 }),
        '2': makeOntimeEvent({ id: '2', timeStart: 10, timeEnd: 20, duration: 10, linkStart: true }),
        '3': makeOntimeBlock({ id: '3' }),
        '4': makeOntimeEvent({ id: '4', timeStart: 20, timeEnd: 30, duration: 10, linkStart: false }),
        '5': makeOntimeEvent({ id: '5', timeStart: 30, timeEnd: 40, duration: 10, linkStart: true }),
      },
    });

    rundownCache.init(testRundown, {});
    rundownMutation.applyDelay(testRundown, testRundown.entries['delay'] as OntimeDelay);

    expect(testRundown.entries).toMatchObject({
      '1': { id: '1', timeStart: 0, timeEnd: 10, duration: 10, revision: 2 },
      '2': { id: '2', timeStart: 0, timeEnd: 10, duration: 10, revision: 2, linkStart: false },
      '3': { id: '3' },
      '4': { id: '4', timeStart: 10, timeEnd: 20, duration: 10, revision: 2, linkStart: false },
      '5': { id: '5', timeStart: 20, timeEnd: 30, duration: 10, revision: 2, linkStart: true },
    });
  });

  it('should account for minimum duration and start when applying negative delays', () => {
    const testRundown = makeRundown({
      order: ['delay', '1', '2'],
      entries: {
        delay: makeOntimeDelay({ id: 'delay', duration: -50 }),
        '1': makeOntimeEvent({ id: '1', timeStart: 0, timeEnd: 100, duration: 100 }),
        '2': makeOntimeEvent({ id: '2', timeStart: 100, timeEnd: 150, duration: 50, linkStart: true }),
      },
    });

    rundownCache.init(testRundown, {});
    rundownMutation.applyDelay(testRundown, testRundown.entries['delay'] as OntimeDelay);

    expect(testRundown.entries).toMatchObject({
      '1': {
        id: '1',
        type: SupportedEntry.Event,
        timeStart: 0,
        timeEnd: 100,
        duration: 100,
        revision: 2,
      } as OntimeEvent,
      '2': {
        id: '2',
        type: SupportedEntry.Event,
        timeStart: 50,
        timeEnd: 100,
        duration: 50,
        linkStart: false,
        revision: 2,
      },
    });
  });

  it('unlinks events to maintain gaps when applying positive delays', () => {
    const testRundown = makeRundown({
      order: ['1', 'delay', '2'],
      entries: {
        '1': makeOntimeEvent({ id: '1', timeStart: 0, timeEnd: 100, duration: 100, revision: 1 }),
        delay: makeOntimeDelay({ id: 'delay', duration: 50 }),
        '2': makeOntimeEvent({ id: '2', timeStart: 100, timeEnd: 150, duration: 50, revision: 1, linkStart: true }),
      },
    });

    rundownCache.init(testRundown, {});
    rundownMutation.applyDelay(testRundown, testRundown.entries['delay'] as OntimeDelay);

    expect(testRundown.entries).toMatchObject({
      '1': {
        id: '1',
        timeStart: 0,
        timeEnd: 100,
        duration: 100,
        revision: 1,
      },
      '2': {
        id: '2',
        timeStart: 150,
        timeEnd: 200,
        duration: 50,
        linkStart: false,
        revision: 2,
      },
    });
  });

  it('maintains links if there is no gap', () => {
    const testRundown = makeRundown({
      order: ['delay', '1', '2'],
      entries: {
        delay: makeOntimeDelay({ id: 'delay', duration: 50 }),
        '1': makeOntimeEvent({ id: '1', timeStart: 0, timeEnd: 100, duration: 100, revision: 1 }),
        '2': makeOntimeEvent({ id: '2', timeStart: 100, timeEnd: 150, duration: 50, revision: 1, linkStart: true }),
      },
    });

    rundownCache.init(testRundown, {});
    rundownMutation.applyDelay(testRundown, testRundown.entries['delay'] as OntimeDelay);

    expect(testRundown.entries).toMatchObject({
      '1': {
        id: '1',
        timeStart: 50,
        timeEnd: 150,
        duration: 100,
        revision: 2,
      },
      '2': {
        id: '2',
        timeStart: 150,
        timeEnd: 200,
        duration: 50,
        linkStart: true,
        revision: 2,
      },
    });
  });

  it('unlinks events to maintain gaps when applying negative delays', () => {
    const testRundown = makeRundown({
      order: ['1', 'delay', '2'],
      entries: {
        '1': makeOntimeEvent({ id: '1', timeStart: 0, timeEnd: 100, duration: 100, revision: 1 }),
        delay: makeOntimeDelay({ id: 'delay', duration: -50 }),
        '2': makeOntimeEvent({ id: '2', timeStart: 100, timeEnd: 150, duration: 50, revision: 1, linkStart: true }),
      },
    });

    rundownCache.init(testRundown, {});
    rundownMutation.applyDelay(testRundown, testRundown.entries['delay'] as OntimeDelay);

    expect(testRundown.entries).toMatchObject({
      '1': { id: '1', timeStart: 0, timeEnd: 100, duration: 100, revision: 1 },
      '2': {
        id: '2',
        timeStart: 50,
        timeEnd: 100,
        duration: 50,
        linkStart: false,
        revision: 2,
      },
    });
  });

  it('gaps reduce positive delay', () => {
    const testRundown = makeRundown({
      order: ['delay', '1', '2', '3', '4', '5'],
      entries: {
        delay: makeOntimeDelay({ id: 'delay', duration: 100 }),
        '1': makeOntimeEvent({ id: '1', timeStart: 0, timeEnd: 100, duration: 100 }),
        // gap 50
        '2': makeOntimeEvent({ id: '2', timeStart: 150, timeEnd: 200, duration: 50, gap: 50 }),
        // gap 0
        '3': makeOntimeEvent({ id: '3', timeStart: 200, timeEnd: 250, duration: 50, gap: 0 }),
        // gap 50
        '4': makeOntimeEvent({ id: '4', timeStart: 300, timeEnd: 350, duration: 50, gap: 50 }),
        // linked
        '5': makeOntimeEvent({ id: '5', timeStart: 350, timeEnd: 400, duration: 50, linkStart: true }),
      },
    });

    rundownCache.init(testRundown, {});
    rundownMutation.applyDelay(testRundown, testRundown.entries['delay'] as OntimeDelay);

    expect(testRundown.entries).toMatchObject({
      '1': { id: '1', timeStart: 0 + 100, timeEnd: 100 + 100, duration: 100, revision: 2 },
      // gap 50 (100 - 50)
      '2': { id: '2', timeStart: 150 + 50, timeEnd: 200 + 50, duration: 50, revision: 2 },
      // gap 50 (50 - 50)
      '3': { id: '3', timeStart: 200 + 50, timeEnd: 250 + 50, duration: 50, revision: 2, gap: 0 },
      // gap (delay is 0)
      '4': { id: '4', timeStart: 300, timeEnd: 350, duration: 50, revision: 1 },
      // linked
      '5': { id: '5', timeStart: 350, timeEnd: 400, duration: 50, revision: 1, linkStart: true },
    });
  });

  it('gaps reduce positive delay (2)', () => {
    const testRundown = makeRundown({
      order: ['delay', '1', '2'],
      entries: {
        delay: makeOntimeDelay({ id: 'delay', duration: 2 * MILLIS_PER_HOUR }),
        '1': makeOntimeEvent({
          id: '1',
          gap: 0,
          dayOffset: 0,
          timeStart: 46800000, // 13:00:00
          timeEnd: 50400000, // 14:00:00
          duration: MILLIS_PER_HOUR,
        }),
        // gap 1h
        '2': makeOntimeEvent({
          id: '2',
          gap: 1 * MILLIS_PER_HOUR,
          dayOffset: 0,
          timeStart: 54000000, // 15:00:00
          timeEnd: 57600000, // 16:00:00
          duration: MILLIS_PER_HOUR,
        }),
      },
    });

    rundownCache.init(testRundown, {});
    rundownMutation.applyDelay(testRundown, testRundown.entries['delay'] as OntimeDelay);

    expect(testRundown.entries).toMatchObject({
      '1': { id: '1', timeStart: 54000000 /* 16 */, revision: 2 },
      // gap 1h (2h - 1h)
      '2': { id: '2', timeStart: 57600000 /* 16 */, revision: 2 },
    });
  });

  it('removes empty delays without applying changes', () => {
    const testRundown = makeRundown({
      order: ['delay', '1'],
      entries: {
        delay: makeOntimeDelay({ id: 'delay', duration: 0 }),
        '1': makeOntimeEvent({ id: '1', timeStart: 0, timeEnd: 100, duration: 100 }),
      },
    });

    rundownCache.init(testRundown, {});
    rundownMutation.applyDelay(testRundown, testRundown.entries['delay'] as OntimeDelay);

    expect(testRundown.entries).toMatchObject({ '1': { id: '1', timeStart: 0, timeEnd: 100, duration: 100 } });
  });

  it('removes delays in last position without applying changes', () => {
    const testRundown = makeRundown({
      order: ['1', 'delay'],
      entries: {
        '1': makeOntimeEvent({ id: '1', timeStart: 0, timeEnd: 100, duration: 100 }),
        delay: makeOntimeDelay({ id: 'delay', duration: 100 }),
      },
    });

    rundownCache.init(testRundown, {});
    rundownMutation.applyDelay(testRundown, testRundown.entries['delay'] as OntimeDelay);

    expect(testRundown.entries).toMatchObject({ '1': { id: '1', timeStart: 0, timeEnd: 100, duration: 100 } });
  });

  it('unlinks events to across blocks is it is the first event after the delay', () => {
    const testRundown = makeRundown({
      order: ['1', 'delay', 'block', '2'],
      entries: {
        '1': makeOntimeEvent({ id: '1', timeStart: 0, timeEnd: 100, duration: 100, revision: 1 }),
        delay: makeOntimeDelay({ id: 'delay', duration: 50 }),
        block: makeOntimeBlock({ id: 'block' }),
        '2': makeOntimeEvent({ id: '2', timeStart: 100, timeEnd: 150, duration: 50, revision: 1, linkStart: true }),
      },
    });

    rundownCache.init(testRundown, {});
    rundownMutation.applyDelay(testRundown, testRundown.entries['delay'] as OntimeDelay);

    expect(testRundown.entries).toMatchObject({
      '1': {
        id: '1',
        timeStart: 0,
        timeEnd: 100,
        duration: 100,
        revision: 1,
      },
      block: { id: 'block' },
      '2': {
        id: '2',
        timeStart: 150,
        timeEnd: 200,
        duration: 50,
        linkStart: false,
        revision: 2,
      },
    });
  });

  it('applies a delay from inside a block', () => {
    const testRundown = makeRundown({
      order: ['1', 'block', '2', '3'],
      entries: {
        '1': makeOntimeEvent({ id: '1', timeStart: 0, timeEnd: 100, duration: 100 }),
        block: makeOntimeBlock({ id: 'block', entries: ['delay'] }),
        delay: makeOntimeDelay({ id: 'delay', duration: 100, parent: 'block' }),
        '2': makeOntimeEvent({ id: '2', timeStart: 100, timeEnd: 200, duration: 100, linkStart: true }),
        '3': makeOntimeEvent({ id: '3', timeStart: 200, timeEnd: 300, duration: 100, linkStart: true }),
      },
    });

    rundownCache.init(testRundown, {});
    rundownMutation.applyDelay(testRundown, testRundown.entries['delay'] as OntimeDelay);

    expect(testRundown.entries).toMatchObject({
      '1': {
        id: '1',
        timeStart: 0,
        timeEnd: 100,
        duration: 100,
        revision: 1,
      },
      '2': {
        id: '2',
        timeStart: 200,
        timeEnd: 300,
        duration: 100,
        linkStart: false,
        revision: 2,
      },
      '3': {
        id: '3',
        timeStart: 300,
        timeEnd: 400,
        duration: 100,
        linkStart: true,
        revision: 2,
      },
    });
  });

  it('applies a delay from across nested orders', () => {
    const testRundown = makeRundown({
      order: ['1', 'delay', 'block', '2', '3'],
      entries: {
        '1': makeOntimeEvent({ id: '1', timeStart: 0, timeEnd: 100, duration: 100 }),
        delay: makeOntimeDelay({ id: 'delay', duration: 100 }),
        block: makeOntimeBlock({ id: 'block', entries: ['block-1'] }),
        'block-1': makeOntimeEvent({
          id: 'block-1',
          timeStart: 100,
          timeEnd: 200,
          duration: 100,
          linkStart: true,
          parent: 'block',
        }),
        '2': makeOntimeEvent({ id: '2', timeStart: 200, timeEnd: 300, duration: 100, linkStart: true }),
        '3': makeOntimeEvent({ id: '3', timeStart: 300, timeEnd: 400, duration: 100, linkStart: true }),
      },
    });

    rundownCache.init(testRundown, {});
    rundownMutation.applyDelay(testRundown, testRundown.entries['delay'] as OntimeDelay);

    expect(testRundown.entries).toMatchObject({
      '1': {
        timeStart: 0,
        timeEnd: 100,
        duration: 100,
        revision: 1,
      },
      'block-1': {
        timeStart: 200,
        timeEnd: 300,
        duration: 100,
        linkStart: false,
        revision: 2,
      },
      '2': {
        timeStart: 300,
        timeEnd: 400,
        duration: 100,
        linkStart: true,
        revision: 2,
      },
      '3': {
        timeStart: 400,
        timeEnd: 500,
        duration: 100,
        linkStart: true,
        revision: 2,
      },
    });
  });
});

describe('rundownMutation.swap()', () => {
  it('should correctly swap data between events', () => {
    const testRundown = makeRundown({
      order: ['1', '2', '3'],
      entries: {
        '1': makeOntimeEvent({ id: '1', cue: 'data1', timeStart: 1 }),
        '2': makeOntimeEvent({ id: '2', cue: 'data2', timeStart: 2 }),
        '3': makeOntimeEvent({ id: '3', cue: 'data3', timeStart: 3 }),
      },
    });

    rundownMutation.swap(testRundown, testRundown.entries['1'] as OntimeEvent, testRundown.entries['2'] as OntimeEvent);

    expect((testRundown.entries['1'] as OntimeEvent).id).toBe('1');
    expect((testRundown.entries['1'] as OntimeEvent).cue).toBe('data2');
    expect((testRundown.entries['1'] as OntimeEvent).timeStart).toBe(1);
    expect((testRundown.entries['1'] as OntimeEvent).revision).toBe(1);

    expect((testRundown.entries['2'] as OntimeEvent).id).toBe('2');
    expect((testRundown.entries['2'] as OntimeEvent).cue).toBe('data1');
    expect((testRundown.entries['2'] as OntimeEvent).timeStart).toBe(2);
    expect((testRundown.entries['2'] as OntimeEvent).revision).toBe(1);

    expect((testRundown.entries['3'] as OntimeEvent).id).toBe('3');
    expect((testRundown.entries['3'] as OntimeEvent).cue).toBe('data3');
    expect((testRundown.entries['3'] as OntimeEvent).timeStart).toBe(3);
    expect((testRundown.entries['3'] as OntimeEvent).revision).toBe(1);
  });
});

describe('rundownMutation.clone()', () => {
  it('clones an event and adds it to the rundown', () => {
    const testRundown = makeRundown({
      order: ['1'],
      entries: {
        '1': makeOntimeEvent({ id: '1', cue: 'data1', parent: null }),
      },
    });

    const newEntry = rundownMutation.clone(testRundown, testRundown.entries['1']);

    expect(testRundown.order).toStrictEqual(['1', newEntry.id]);
    expect(testRundown.entries[newEntry.id]).toMatchObject({
      type: SupportedEntry.Event,
      cue: 'data1',
      parent: null,
      revision: 0,
    });
  });

  it('clones an event inside a block and adds it to the rundown', () => {
    const testRundown = makeRundown({
      order: ['1'],
      entries: {
        '1': makeOntimeBlock({ id: '1', entries: ['1a'] }),
        '1a': makeOntimeEvent({ id: '1a', cue: 'nested', parent: '1' }),
      },
    });

    const newEntry = rundownMutation.clone(testRundown, testRundown.entries['1a']);

    expect(testRundown.order).toStrictEqual(['1']);
    expect(testRundown.entries['1']).toMatchObject({ entries: ['1a', newEntry.id] });
    expect(testRundown.entries[newEntry.id]).toMatchObject({
      type: SupportedEntry.Event,
      parent: '1',
      cue: 'nested',
    });
  });

  it('clones a block and its nested elements', () => {
    const testRundown = makeRundown({
      order: ['1'],
      entries: {
        '1': makeOntimeBlock({ id: '1', title: 'top', entries: ['1a'] }),
        '1a': makeOntimeEvent({ id: '1a', cue: 'nested', parent: '1' }),
      },
    });

    const newEntry = rundownMutation.clone(testRundown, testRundown.entries['1']);

    expect(testRundown.order).toStrictEqual(['1', newEntry.id]);
    expect(testRundown.entries[newEntry.id]).toMatchObject({
      type: SupportedEntry.Block,
      entries: [expect.any(String)],
    });
    expect((testRundown.entries[newEntry.id] as OntimeBlock).entries[0]).not.toBe('1a');
  });
});

describe('rundownMutation.group()', () => {
  it('groups a list of existing events into a new block', () => {
    const rundown = makeRundown({
      order: ['1', '2', '3'],
      entries: {
        '1': makeOntimeEvent({ id: '1', parent: null }),
        '2': makeOntimeEvent({ id: '2', parent: null }),
        '3': makeOntimeEvent({ id: '3', parent: null }),
      },
    });

    rundownMutation.group(rundown, ['1', '2']);

    const blockId = rundown.order[0];
    expect(blockId).toStrictEqual(expect.any(String));
    expect(rundown.order).toStrictEqual([expect.any(String), '3']);
    expect(rundown.entries).toMatchObject({
      [blockId]: {
        type: SupportedEntry.Block,
        entries: ['1', '2'],
      },
      '1': { id: '1', type: SupportedEntry.Event, parent: blockId },
      '2': { id: '2', type: SupportedEntry.Event, parent: blockId },
      '3': { id: '3', type: SupportedEntry.Event, parent: null },
    });
  });
});

describe('rundownMutation.ungroup()', () => {
  it('should correctly dissolve a block into its events', () => {
    const testRundown = makeRundown({
      order: ['1', '2'],
      entries: {
        '1': makeOntimeEvent({ id: '1', cue: 'data1', parent: null }),
        '2': makeOntimeBlock({ id: '2', entries: ['21', '22'] }),
        '21': makeOntimeEvent({ id: '21', cue: 'data21', parent: '2' }),
        '22': makeOntimeEvent({ id: '22', cue: 'data22', parent: '2' }),
      },
    });

    rundownMutation.ungroup(testRundown, testRundown.entries['2'] as OntimeBlock);

    expect(testRundown.order).toStrictEqual(['1', '21', '22']);
    expect(testRundown.entries['2']).toBeUndefined();
    expect(testRundown.entries).toMatchObject({
      '1': { id: '1', type: SupportedEntry.Event, cue: 'data1', parent: null },
      '21': { id: '21', type: SupportedEntry.Event, cue: 'data21', parent: null },
      '22': { id: '22', type: SupportedEntry.Event, cue: 'data22', parent: null },
    });
  });
});

describe('customFieldMutation.add()', () => {
  it('adds a custom field given object', () => {
    const customFields = {
      one: makeCustomField({ label: 'one' }),
    };

    customFieldMutation.add(customFields, 'two', makeCustomField({ label: 'two' }));

    expect(customFields).toMatchObject({
      one: { label: 'one' },
      two: { label: 'two' },
    });
  });
});

describe('customFieldMutation.edit()', () => {
  it('changes properties of an existing custom field', () => {
    const customFields = {
      one: makeCustomField({ label: 'one', colour: 'blue' }),
    };

    customFieldMutation.edit(customFields, 'one', customFields.one, { colour: 'red' });

    expect(customFields).toMatchObject({
      one: { label: 'one', colour: 'red' },
    });
  });

  it('changing the label makes a new key', () => {
    const customFields = {
      one: makeCustomField({ label: 'one', colour: 'blue' }),
    };

    const { oldKey, newKey } = customFieldMutation.edit(customFields, 'one', customFields.one, {
      label: 'two',
      colour: 'red',
    });

    expect(oldKey).toBe('one');
    expect(newKey).not.toEqual(oldKey);

    expect(customFields).toMatchObject({
      [oldKey]: { label: 'one', colour: 'blue' },
      [newKey]: { label: 'two', colour: 'red' },
    });
  });
});

describe('customFieldMutation.remove()', () => {
  it('deletes a custom field from the object', () => {
    const customFields = {
      one: makeCustomField({ label: 'one', colour: 'blue' }),
    };

    customFieldMutation.remove(customFields, 'one');

    expect(customFields).not.toHaveProperty('one');
  });
});

describe('customFieldMutation.renameUsages()', () => {
  it('renames all custom field entries in a given rundown', () => {
    const rundown = makeRundown({
      order: ['1', '2', '3'],
      entries: {
        '1': makeOntimeEvent({ id: '1', custom: { one: 'value1' } }),
        '2': makeOntimeEvent({ id: '2', custom: { one: 'value2' } }),
        '3': makeOntimeEvent({ id: '3', custom: { two: 'value3' } }),
      },
    });

    const assigned: AssignedMap = {
      one: ['1', '2'],
      two: ['3'],
    };

    customFieldMutation.renameUsages(rundown, assigned, 'one', 'new-one');
    expect(rundown.entries).toMatchObject({
      '1': { id: '1', custom: { 'new-one': 'value1' } },
      '2': { id: '2', custom: { 'new-one': 'value2' } },
      '3': { id: '3', custom: { two: 'value3' } },
    });

    expect(assigned).toStrictEqual({
      'new-one': ['1', '2'],
      two: ['3'],
    });
  });
});

describe('customFieldMutation.removeUsages()', () => {
  it('deletes all custom field entries in a given rundown', () => {
    const rundown = makeRundown({
      order: ['1', '2', '3'],
      entries: {
        '1': makeOntimeEvent({ id: '1', custom: { one: 'value1' } }),
        '2': makeOntimeEvent({ id: '2', custom: { one: 'value2' } }),
        '3': makeOntimeEvent({ id: '3', custom: { two: 'value3' } }),
      },
    });

    const assigned: AssignedMap = {
      one: ['1', '2'],
      two: ['3'],
    };

    customFieldMutation.removeUsages(rundown, assigned, 'one');
    expect((rundown.entries['1'] as OntimeEvent).custom).not.toHaveProperty('one');
    expect((rundown.entries['2'] as OntimeEvent).custom).not.toHaveProperty('one');

    expect(assigned).toStrictEqual({
      two: ['3'],
    });
  });
});
