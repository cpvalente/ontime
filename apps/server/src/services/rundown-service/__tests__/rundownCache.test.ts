import {
  CustomFields,
  EndAction,
  EventCustomFields,
  OntimeBlock,
  OntimeDelay,
  OntimeEvent,
  OntimeRundown,
  SupportedEvent,
  TimeStrategy,
  TimerType,
} from 'ontime-types';
import { MILLIS_PER_HOUR, dayInMs, millisToString } from 'ontime-utils';

import { calculateRuntimeDelays, getDelayAt, calculateRuntimeDelaysFrom } from '../delayUtils.js';
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

describe('generate()', () => {
  it('creates normalised versions of a given rundown', () => {
    const testRundown: OntimeRundown = [
      { type: SupportedEvent.Event, id: '1' } as OntimeEvent,
      { type: SupportedEvent.Block, id: '2' } as OntimeBlock,
      { type: SupportedEvent.Delay, id: '3' } as OntimeDelay,
    ];

    const initResult = generate(testRundown);
    expect(initResult.order.length).toBe(3);
    expect(initResult.order).toStrictEqual(['1', '2', '3']);
    expect(initResult.rundown['1'].type).toBe(SupportedEvent.Event);
    expect(initResult.rundown['2'].type).toBe(SupportedEvent.Block);
    expect(initResult.rundown['3'].type).toBe(SupportedEvent.Delay);
  });

  it('calculates delays versions of a given rundown', () => {
    const testRundown: OntimeRundown = [
      { type: SupportedEvent.Delay, id: '1', duration: 100 } as OntimeDelay,
      { type: SupportedEvent.Event, id: '2', timeStart: 1, timeEnd: 100 } as OntimeEvent,
    ];

    const initResult = generate(testRundown);
    expect(initResult.order.length).toBe(2);
    expect((initResult.rundown['2'] as OntimeEvent).delay).toBe(100);
    expect(initResult.totalDelay).toBe(100);
  });

  it('accounts for gaps in rundown when calculating delays', () => {
    const testRundown: OntimeRundown = [
      { type: SupportedEvent.Event, id: '1', timeStart: 100, timeEnd: 200 } as OntimeEvent,
      { type: SupportedEvent.Delay, id: 'delay', duration: 200 } as OntimeDelay,
      { type: SupportedEvent.Event, id: '2', timeStart: 200, timeEnd: 300 } as OntimeEvent,
      { type: SupportedEvent.Block, id: 'block', title: 'break' } as OntimeBlock,
      { type: SupportedEvent.Event, id: '3', timeStart: 400, timeEnd: 500 } as OntimeEvent,
      { type: SupportedEvent.Block, id: 'another-block', title: 'another-break' } as OntimeBlock,
      { type: SupportedEvent.Event, id: '4', timeStart: 600, timeEnd: 700 } as OntimeEvent,
    ];

    const initResult = generate(testRundown);
    expect(initResult.order.length).toBe(7);
    expect((initResult.rundown['1'] as OntimeEvent).delay).toBe(0);
    expect((initResult.rundown['2'] as OntimeEvent).delay).toBe(200);
    expect((initResult.rundown['3'] as OntimeEvent).delay).toBe(100);
    expect((initResult.rundown['4'] as OntimeEvent).delay).toBe(0);
    expect(initResult.totalDelay).toBe(0);
    expect(initResult.totalDuration).toBe(700 - 100);
  });

  it('handles negative delays', () => {
    const testRundown: OntimeRundown = [
      { type: SupportedEvent.Event, id: '1', timeStart: 100, timeEnd: 200 } as OntimeEvent,
      { type: SupportedEvent.Delay, id: 'delay', duration: -200 } as OntimeDelay,
      { type: SupportedEvent.Event, id: '2', timeStart: 200, timeEnd: 300 } as OntimeEvent,
      { type: SupportedEvent.Block, id: 'block', title: 'break' } as OntimeBlock,
      { type: SupportedEvent.Event, id: '3', timeStart: 400, timeEnd: 500 } as OntimeEvent,
      { type: SupportedEvent.Block, id: 'another-block', title: 'another-break' } as OntimeBlock,
      { type: SupportedEvent.Event, id: '4', timeStart: 600, timeEnd: 700 } as OntimeEvent,
    ];

    const initResult = generate(testRundown);
    expect(initResult.order.length).toBe(7);
    expect((initResult.rundown['1'] as OntimeEvent).delay).toBe(0);
    expect((initResult.rundown['2'] as OntimeEvent).delay).toBe(-200);
    expect((initResult.rundown['3'] as OntimeEvent).delay).toBe(-200);
    expect((initResult.rundown['4'] as OntimeEvent).delay).toBe(-200);
    expect(initResult.totalDelay).toBe(-200);
    expect(initResult.totalDuration).toBe(700 - 100);
  });

  it('links times across events', () => {
    const testRundown: OntimeRundown = [
      {
        type: SupportedEvent.Event,
        id: '1',
        timeStart: 1,
        duration: 1,
        timeEnd: 2,
        timeStrategy: TimeStrategy.LockEnd,
      } as OntimeEvent,
      {
        type: SupportedEvent.Event,
        id: '2',
        timeStart: 11,
        duration: 1,
        timeEnd: 12,
        linkStart: '1',
        timeStrategy: TimeStrategy.LockEnd,
      } as OntimeEvent,
      { type: SupportedEvent.Block, id: 'block' } as OntimeBlock,
      { type: SupportedEvent.Delay, id: 'delay' } as OntimeDelay,
      {
        type: SupportedEvent.Event,
        id: '3',
        timeStart: 21,
        duration: 1,
        timeEnd: 22,
        linkStart: '2',
        timeStrategy: TimeStrategy.LockEnd,
      } as OntimeEvent,
    ];

    const initResult = generate(testRundown);
    expect(initResult.order.length).toBe(5);
    expect((initResult.rundown['2'] as OntimeEvent).timeStart).toBe(2);
    expect((initResult.rundown['2'] as OntimeEvent).timeEnd).toBe(12);
    expect((initResult.rundown['2'] as OntimeEvent).duration).toBe(10);

    expect((initResult.rundown['3'] as OntimeEvent).timeStart).toBe(12);
    expect((initResult.rundown['3'] as OntimeEvent).timeEnd).toBe(22);
    expect((initResult.rundown['3'] as OntimeEvent).duration).toBe(10);

    expect(initResult.links['1']).toBe('2');
    expect(initResult.links['2']).toBe('3');
  });

  it('links times across events, reordered', () => {
    const testRundown: OntimeRundown = [
      { type: SupportedEvent.Event, id: '1', timeStart: 1, timeEnd: 2 } as OntimeEvent,
      { type: SupportedEvent.Event, id: '3', timeStart: 21, timeEnd: 22, linkStart: '2' } as OntimeEvent,
      { type: SupportedEvent.Event, id: '2', timeStart: 11, timeEnd: 12, linkStart: '1' } as OntimeEvent,
    ];

    const initResult = generate(testRundown);
    expect(initResult.order.length).toBe(3);
    expect((initResult.rundown['3'] as OntimeEvent).timeStart).toBe(2);
    expect(initResult.links['1']).toBe('3');
    expect(initResult.links['3']).toBe('2');
  });

  it('calculates total duration', () => {
    const testRundown: OntimeRundown = [
      { type: SupportedEvent.Event, id: '1', timeStart: 100, timeEnd: 200 } as OntimeEvent,
      { type: SupportedEvent.Event, id: '2', timeStart: 200, timeEnd: 300 } as OntimeEvent,
      { type: SupportedEvent.Event, id: 'skipped', skip: true, timeStart: 300, timeEnd: 400 } as OntimeEvent,
      { type: SupportedEvent.Event, id: '3', timeStart: 400, timeEnd: 500 } as OntimeEvent,
    ];

    const initResult = generate(testRundown);
    expect(initResult.order.length).toBe(4);
    expect(initResult.totalDuration).toBe(500 - 100);
  });

  it('calculates total duration with 0 duration events without causing a next day', () => {
    const testRundown: OntimeRundown = [
      { type: SupportedEvent.Event, id: '1', timeStart: 100, timeEnd: 100, duration: 0 } as OntimeEvent,
      { type: SupportedEvent.Event, id: '2', timeStart: 100, timeEnd: 300 } as OntimeEvent,
      { type: SupportedEvent.Event, id: 'skipped', skip: true, timeStart: 300, timeEnd: 400 } as OntimeEvent,
      { type: SupportedEvent.Event, id: '3', timeStart: 400, timeEnd: 500 } as OntimeEvent,
    ];

    const initResult = generate(testRundown);
    expect(initResult.order.length).toBe(4);
    expect(initResult.totalDuration).toBe(500 - 100);
  });

  it('calculates total duration across days with gap', () => {
    const testRundown: OntimeRundown = [
      {
        type: SupportedEvent.Event,
        id: '1',
        timeStart: new Date(0).setHours(9),
        timeEnd: new Date(0).setHours(23),
      } as OntimeEvent,
      {
        type: SupportedEvent.Event,
        id: '2',
        timeStart: new Date(0).setHours(9),
        timeEnd: new Date(0).setHours(23),
      } as OntimeEvent,
      {
        type: SupportedEvent.Event,
        id: '3',
        timeStart: new Date(0).setHours(9),
        timeEnd: new Date(0).setHours(23),
      } as OntimeEvent,
    ];

    const initResult = generate(testRundown);
    const expectedDuration = (23 - 9 + 48) * MILLIS_PER_HOUR;
    expect(millisToString(initResult.totalDuration)).toBe('62:00:00');
    expect(initResult.totalDuration).toBe(expectedDuration);
  });

  it('calculates total duration across days', () => {
    const testRundown: OntimeRundown = [
      {
        type: SupportedEvent.Event,
        id: '1',
        timeStart: new Date(0).setHours(12),
        timeEnd: new Date(0).setHours(22),
      } as OntimeEvent,
      {
        type: SupportedEvent.Event,
        id: '2',
        timeStart: new Date(0).setHours(22),
        timeEnd: new Date(0).setHours(8),
      } as OntimeEvent,
    ];

    const initResult = generate(testRundown);
    const expectedDuration = 8 * MILLIS_PER_HOUR + (dayInMs - 12 * MILLIS_PER_HOUR);
    expect(millisToString(initResult.totalDuration)).toBe('20:00:00');
    expect(initResult.totalDuration).toBe(expectedDuration);
  });

  it('handles updating event sequence', () => {
    const testRundown: OntimeRundown = [
      {
        type: SupportedEvent.Event,
        id: '97cc3e',
        timeStart: 0,
        timeEnd: 600000,
        duration: 600000,
        timeStrategy: TimeStrategy.LockDuration,
        linkStart: null,
      } as OntimeEvent,
      {
        type: SupportedEvent.Event,
        id: 'e01948',
        timeStart: 600000,
        timeEnd: 601000,
        duration: 85801000, // <------------- value out of sync
        timeStrategy: TimeStrategy.LockEnd,
        linkStart: '97cc3e',
      } as OntimeEvent,
      {
        type: SupportedEvent.Event,
        id: '25c1af',
        timeStart: 100, // <------------- value out of sync
        timeEnd: 602000,
        duration: 0,
        timeStrategy: TimeStrategy.LockEnd,
        linkStart: 'e01948',
      } as OntimeEvent,
    ];

    const initResult = generate(testRundown);
    expect(initResult.rundown).toMatchObject({
      '97cc3e': {
        timeStart: 0,
        timeEnd: 600000,
        duration: 600000,
        timeStrategy: 'lock-duration',
        linkStart: null,
      },
      e01948: {
        timeStart: 600000,
        timeEnd: 601000,
        duration: 1000,
        timeStrategy: 'lock-end',
        linkStart: '97cc3e',
      },
      '25c1af': {
        timeStart: 601000,
        timeEnd: 602000,
        duration: 1000,
        timeStrategy: 'lock-end',
        linkStart: 'e01948',
      },
    });
  });

  it('deletes links if invalid', () => {
    const testRundown: OntimeRundown = [
      { type: SupportedEvent.Event, id: '1', timeStart: 1, linkStart: '10' } as OntimeEvent,
    ];
    const initResult = generate(testRundown);
    expect(initResult.order.length).toBe(1);
    expect((initResult.rundown['1'] as OntimeEvent).timeStart).toBe(1);
    expect(Object.keys(initResult.links).length).toBe(0);
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
      const testRundown: OntimeRundown = [
        {
          type: SupportedEvent.Event,
          id: '1',
          custom: {
            lighting: 'event 1 lx',
          } as EventCustomFields,
        } as OntimeEvent,
        {
          type: SupportedEvent.Event,
          id: '2',
          custom: {
            lighting: 'event 2 lx',
            sound: 'event 2 sound',
          } as EventCustomFields,
        } as OntimeEvent,
      ];
      const initResult = generate(testRundown, customProperties);
      expect(initResult.order.length).toBe(2);
      expect(initResult.assignedCustomProperties).toMatchObject({
        lighting: ['1', '2'],
        sound: ['2'],
      });
      expect((initResult.rundown['1'] as OntimeEvent).custom).toMatchObject({ lighting: 'event 1 lx' });
      expect((initResult.rundown['2'] as OntimeEvent).custom).toMatchObject({
        lighting: 'event 2 lx',
        sound: 'event 2 sound',
      });
    });
  });
});

describe('add() mutation', () => {
  test('adds an event to the rundown', () => {
    const mockEvent = { id: 'mock', cue: 'mock', type: SupportedEvent.Event } as OntimeEvent;
    const testRundown: OntimeRundown = [];
    const { newRundown } = add({ atIndex: 0, event: mockEvent, persistedRundown: testRundown });
    expect(newRundown.length).toBe(1);
    expect(newRundown[0]).toMatchObject(mockEvent);
  });
});

describe('remove() mutation', () => {
  test('deletes an event from the rundown', () => {
    const mockEvent = { id: 'mock', cue: 'mock', type: SupportedEvent.Event } as OntimeEvent;
    const testRundown: OntimeRundown = [mockEvent];
    const { newRundown } = remove({ eventIds: [mockEvent.id], persistedRundown: testRundown });
    expect(newRundown.length).toBe(0);
  });
  test('deletes multiple events from the rundown', () => {
    const testRundown: OntimeRundown = [
      { type: SupportedEvent.Event, id: '1' } as OntimeEvent,
      { type: SupportedEvent.Block, id: '2' } as OntimeBlock,
      { type: SupportedEvent.Delay, id: '3' } as OntimeDelay,
      { type: SupportedEvent.Event, id: '4' } as OntimeEvent,
      { type: SupportedEvent.Event, id: '5' } as OntimeEvent,
      { type: SupportedEvent.Event, id: '6' } as OntimeEvent,
    ];
    const { newRundown } = remove({ eventIds: ['1', '2', '3'], persistedRundown: testRundown });
    expect(newRundown.length).toBe(3);
    expect(newRundown.at(0)?.id).toBe('4');
  });
});

describe('edit() mutation', () => {
  test('edits an event in the rundown', () => {
    const mockEvent = { id: 'mock', cue: 'mock', type: SupportedEvent.Event } as OntimeEvent;
    const mockEventPatch = { cue: 'patched' } as OntimeEvent;
    const testRundown: OntimeRundown = [mockEvent];
    const { newRundown, newEvent } = edit({
      eventId: mockEvent.id,
      patch: mockEventPatch,
      persistedRundown: testRundown,
    });
    expect(newRundown.length).toBe(1);
    expect(newEvent).toMatchObject({
      id: 'mock',
      cue: 'patched',
      type: SupportedEvent.Event,
    });
  });
});

describe('batchEdit() mutation', () => {
  it('should correctly apply the patch to the events with the given IDs', () => {
    const persistedRundown: OntimeRundown = [
      { id: '1', type: SupportedEvent.Event, cue: 'data1' } as OntimeEvent,
      { id: '2', type: SupportedEvent.Event, cue: 'data2' } as OntimeEvent,
      { id: '3', type: SupportedEvent.Event, cue: 'data3' } as OntimeEvent,
    ];
    const eventIds = ['1', '3'];
    const patch = { cue: 'newData' };

    const { newRundown } = batchEdit({ persistedRundown, eventIds, patch });

    expect(newRundown).toMatchObject([
      { id: '1', type: SupportedEvent.Event, cue: 'newData' },
      { id: '2', type: SupportedEvent.Event, cue: 'data2' },
      { id: '3', type: SupportedEvent.Event, cue: 'newData' },
    ]);
  });
});

describe('reorder() mutation', () => {
  it('should correctly reorder two events', () => {
    const persistedRundown: OntimeRundown = [
      { id: '1', type: SupportedEvent.Event, cue: 'data1', revision: 0 } as OntimeEvent,
      { id: '2', type: SupportedEvent.Event, cue: 'data2', revision: 0 } as OntimeEvent,
      { id: '3', type: SupportedEvent.Event, cue: 'data3', revision: 0 } as OntimeEvent,
    ];
    const { newRundown } = reorder({
      persistedRundown,
      eventId: persistedRundown[0].id,
      from: 0,
      to: persistedRundown.length - 1,
    });

    expect(newRundown).toMatchObject([
      { id: '2', type: SupportedEvent.Event, cue: 'data2', revision: 1 },
      { id: '3', type: SupportedEvent.Event, cue: 'data3', revision: 1 },
      { id: '1', type: SupportedEvent.Event, cue: 'data1', revision: 1 },
    ]);
  });
});

describe('swap() mutation', () => {
  it('should correctly swap data between events', () => {
    const persistedRundown: OntimeRundown = [
      { id: '1', type: SupportedEvent.Event, cue: 'data1', timeStart: 1, revision: 0 } as OntimeEvent,
      { id: '2', type: SupportedEvent.Event, cue: 'data2', timeStart: 2, revision: 0 } as OntimeEvent,
      { id: '3', type: SupportedEvent.Event, cue: 'data3', timeStart: 3, revision: 0 } as OntimeEvent,
    ];
    const { newRundown } = swap({
      persistedRundown,
      fromId: persistedRundown[0].id,
      toId: persistedRundown[1].id,
    });

    expect((newRundown[0] as OntimeEvent).id).toBe('1');
    expect((newRundown[0] as OntimeEvent).cue).toBe('data2');
    expect((newRundown[0] as OntimeEvent).timeStart).toBe(1);
    expect((newRundown[0] as OntimeEvent).revision).toBe(1);

    expect((newRundown[1] as OntimeEvent).id).toBe('2');
    expect((newRundown[1] as OntimeEvent).cue).toBe('data1');
    expect((newRundown[1] as OntimeEvent).timeStart).toBe(2);
    expect((newRundown[1] as OntimeEvent).revision).toBe(1);

    expect((newRundown[2] as OntimeEvent).id).toBe('3');
    expect((newRundown[2] as OntimeEvent).cue).toBe('data3');
    expect((newRundown[2] as OntimeEvent).timeStart).toBe(3);
    expect((newRundown[2] as OntimeEvent).revision).toBe(0);
  });
});

/**
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 */

describe('calculateRuntimeDelays', () => {
  it('calculates all delays in a given rundown', () => {
    const rundown: OntimeRundown = [
      {
        title: '',
        note: '',
        endAction: EndAction.None,
        timerType: TimerType.CountDown,
        timeStrategy: TimeStrategy.LockEnd,
        linkStart: null,
        timeStart: 600000,
        timeEnd: 1200000,
        duration: 600000,
        isPublic: true,
        skip: false,
        colour: '',
        type: SupportedEvent.Event,
        revision: 0,
        timeWarning: 120000,
        timeDanger: 60000,
        id: '659e1',
        cue: '1',
        custom: {},
      },
      {
        duration: 600000,
        type: SupportedEvent.Delay,
        id: '07986',
      },
      {
        title: '',
        note: '',
        endAction: EndAction.None,
        timerType: TimerType.CountDown,
        timeStrategy: TimeStrategy.LockEnd,
        linkStart: null,
        timeStart: 1200000,
        timeEnd: 1200000,
        duration: 0,
        isPublic: true,
        skip: false,
        colour: '',
        type: SupportedEvent.Event,
        revision: 0,
        timeWarning: 120000,
        timeDanger: 60000,
        id: '1c48f',
        cue: '2',
        custom: {},
      },
      {
        duration: 1200000,
        type: SupportedEvent.Delay,
        id: '7db42',
      },
      {
        title: '',
        note: '',
        endAction: EndAction.None,
        timerType: TimerType.CountDown,
        timeStrategy: TimeStrategy.LockEnd,
        linkStart: null,
        timeStart: 600000,
        timeEnd: 1200000,
        duration: 600000,
        isPublic: true,
        skip: false,
        colour: '',
        type: SupportedEvent.Event,
        revision: 0,
        timeWarning: 120000,
        timeDanger: 60000,
        id: 'd48c2',
        cue: '3',
        custom: {},
      },
      {
        title: '',
        type: SupportedEvent.Block,
        id: '9870d',
      },
      {
        title: '',
        note: '',
        endAction: EndAction.None,
        timerType: TimerType.CountDown,
        timeStrategy: TimeStrategy.LockEnd,
        linkStart: null,
        timeStart: 1200000,
        timeEnd: 1800000,
        duration: 600000,
        isPublic: true,
        skip: false,
        colour: '',
        type: SupportedEvent.Event,
        revision: 0,
        timeWarning: 120000,
        timeDanger: 60000,
        id: '2f185',
        cue: '4',
        custom: {},
      },
    ];

    const updatedRundown = calculateRuntimeDelays(rundown);

    expect(rundown.length).toBe(updatedRundown.length);
    expect((updatedRundown[0] as OntimeEvent).delay).toBe(0);
    expect((updatedRundown[2] as OntimeEvent).delay).toBe(600000);
    expect((updatedRundown[4] as OntimeEvent).delay).toBe(600000 + 1200000);
    expect((updatedRundown[6] as OntimeEvent).delay).toBe(0);
  });
});

describe('getDelayAt()', () => {
  const delayedRundown: OntimeRundown = [
    {
      title: '',
      note: '',
      endAction: EndAction.None,
      timerType: TimerType.CountDown,
      timeStrategy: TimeStrategy.LockEnd,
      linkStart: null,
      timeStart: 600000,
      timeEnd: 1200000,
      duration: 600000,
      isPublic: true,
      skip: false,
      colour: '',
      type: SupportedEvent.Event,
      revision: 0,
      timeWarning: 120000,
      timeDanger: 60000,
      id: '659e1',
      delay: 0,
      cue: '1',
      custom: {},
    },
    {
      duration: 600000,
      type: SupportedEvent.Delay,
      id: '07986',
    },
    {
      title: '',
      note: '',
      endAction: EndAction.None,
      timerType: TimerType.CountDown,
      timeStrategy: TimeStrategy.LockEnd,
      linkStart: null,
      timeStart: 1200000,
      timeEnd: 1200000,
      duration: 0,
      isPublic: true,
      skip: false,
      colour: '',
      type: SupportedEvent.Event,
      revision: 0,
      timeWarning: 120000,
      timeDanger: 60000,
      id: '1c48f',
      delay: 600000,
      cue: '2',
      custom: {},
    },
    {
      duration: 1200000,
      type: SupportedEvent.Delay,
      id: '7db42',
    },
    {
      title: '',
      note: '',
      endAction: EndAction.None,
      timerType: TimerType.CountDown,
      timeStrategy: TimeStrategy.LockEnd,
      linkStart: null,
      timeStart: 600000,
      timeEnd: 1200000,
      duration: 600000,
      isPublic: true,
      skip: false,
      colour: '',
      type: SupportedEvent.Event,
      revision: 0,
      timeWarning: 120000,
      timeDanger: 60000,
      id: 'd48c2',
      delay: 1800000,
      cue: '3',
      custom: {},
    },
    {
      title: '',
      type: SupportedEvent.Block,
      id: '9870d',
    },
    {
      title: '',
      note: '',
      endAction: EndAction.None,
      timerType: TimerType.CountDown,
      timeStrategy: TimeStrategy.LockEnd,
      linkStart: null,
      timeStart: 1200000,
      timeEnd: 1800000,
      duration: 600000,
      isPublic: true,
      skip: false,
      colour: '',
      type: SupportedEvent.Event,
      revision: 0,
      timeWarning: 120000,
      timeDanger: 60000,
      id: '2f185',
      delay: 0,
      cue: '4',
      custom: {},
    },
  ];

  it('calculates delay in a rundown', () => {
    const delayAtStart = getDelayAt(0, delayedRundown);
    const delayOnFirstEvent = getDelayAt(2, delayedRundown);
    const delayOnSecondEvent = getDelayAt(4, delayedRundown);
    const delayOnBlockedEvent = getDelayAt(0, delayedRundown);

    expect(delayAtStart).toBe(0);
    expect(delayOnFirstEvent).toBe(600000);
    expect(delayOnSecondEvent).toBe(600000 + 1200000);
    expect(delayOnBlockedEvent).toBe(0);
  });
  it('finds delay before a delay block', () => {
    const valueOnFirstDelayBlock = getDelayAt(1, delayedRundown);
    const valueOnSecondDelayBlock = getDelayAt(3, delayedRundown);
    const valueAfterSecondDelayBlock = getDelayAt(4, delayedRundown);

    expect(valueOnFirstDelayBlock).toBe(0);
    expect(valueOnSecondDelayBlock).toBe(600000);
    expect(valueAfterSecondDelayBlock).toBe(600000 + 1200000);
  });
  it('returns 0 after blocks', () => {
    const valueOnBlock = getDelayAt(6, delayedRundown);
    expect(valueOnBlock).toBe(0);
  });
});

describe('calculateRuntimeDelaysFrom()', () => {
  it('updates delays from given id', () => {
    const delayedRundown: OntimeRundown = [
      {
        title: '',
        note: '',
        endAction: EndAction.None,
        timerType: TimerType.CountDown,
        timeStrategy: TimeStrategy.LockEnd,
        linkStart: null,
        timeStart: 600000,
        timeEnd: 1200000,
        duration: 600000,
        isPublic: true,
        skip: false,
        colour: '',
        type: SupportedEvent.Event,
        revision: 0,
        timeWarning: 120000,
        timeDanger: 60000,
        id: '659e1',
        delay: 0,
        cue: '1',
        custom: {},
      },
      {
        duration: 600000,
        type: SupportedEvent.Delay,
        id: '07986',
      },
      {
        title: '',
        note: '',
        endAction: EndAction.None,
        timerType: TimerType.CountDown,
        timeStrategy: TimeStrategy.LockEnd,
        linkStart: null,
        timeStart: 1200000,
        timeEnd: 1200000,
        duration: 0,
        isPublic: true,
        skip: false,
        colour: '',
        type: SupportedEvent.Event,
        revision: 0,
        timeWarning: 120000,
        timeDanger: 60000,
        id: '1c48f',
        delay: 0,
        cue: '2',
        custom: {},
      },
      {
        duration: 1200000,
        type: SupportedEvent.Delay,
        id: '7db42',
      },
      {
        title: '',
        note: '',
        endAction: EndAction.None,
        timerType: TimerType.CountDown,
        timeStrategy: TimeStrategy.LockEnd,
        linkStart: null,
        timeStart: 600000,
        timeEnd: 1200000,
        duration: 600000,
        isPublic: true,
        skip: false,
        colour: '',
        type: SupportedEvent.Event,
        revision: 0,
        timeWarning: 120000,
        timeDanger: 60000,
        id: 'd48c2',
        delay: 1800000,
        cue: '3',
        custom: {},
      },
      {
        title: '',
        type: SupportedEvent.Block,
        id: '9870d',
      },
      {
        title: '',
        note: '',
        endAction: EndAction.None,
        timerType: TimerType.CountDown,
        timeStrategy: TimeStrategy.LockEnd,
        linkStart: null,
        timeStart: 1200000,
        timeEnd: 1800000,
        duration: 600000,
        isPublic: true,
        skip: false,
        colour: '',
        type: SupportedEvent.Event,
        revision: 0,
        timeWarning: 120000,
        timeDanger: 60000,
        id: '2f185',
        delay: 0,
        cue: '4',
        custom: {},
      },
    ];

    const updatedRundown = calculateRuntimeDelaysFrom('07986', delayedRundown);

    // we only update from the 4th on
    expect((updatedRundown[0] as OntimeEvent).delay).toBe(0);
    // 1 + 3
    expect((updatedRundown[4] as OntimeEvent).delay).toBe(600000 + 1200000);
  });
});

describe('custom fields', () => {
  describe('createCustomField()', () => {
    beforeEach(() => {
      vi.mock('../../classes/data-provider/DataProvider.js', () => {
        return {
          DataProvider: {
            ...vi.fn().mockImplementation(() => {
              return {};
            }),
            getCustomFields: vi.fn().mockReturnValue({}),
            setCustomFields: vi.fn().mockImplementation((newData) => {
              return newData;
            }),
            persist: vi.fn().mockReturnValue({}),
          },
        };
      });
    });

    it('creates a field from given parameters', async () => {
      const expected = {
        lighting: {
          label: 'Lighting',
          type: 'string',
          colour: 'blue',
        },
      };

      const customField = await createCustomField({ label: 'Lighting', type: 'string', colour: 'blue' });
      expect(customField).toStrictEqual(expected);
    });
  });

  describe('editCustomField()', () => {
    it('edits a field with a given label', async () => {
      await createCustomField({ label: 'Sound', type: 'string', colour: 'blue' });

      const expected = {
        lighting: {
          label: 'Lighting',
          type: 'string',
          colour: 'blue',
        },
        sound: {
          label: 'Sound',
          type: 'string',
          colour: 'green',
        },
      };

      const customField = await editCustomField('sound', { label: 'Sound', type: 'string', colour: 'green' });
      expect(customFieldChangelog).toStrictEqual(new Map());

      expect(customField).toStrictEqual(expected);
    });

    it('renames a field to a new label', async () => {
      const created = await createCustomField({ label: 'Video', type: 'string', colour: 'red' });

      const expected = {
        lighting: {
          label: 'Lighting',
          type: 'string',
          colour: 'blue',
        },
        sound: {
          label: 'Sound',
          type: 'string',
          colour: 'green',
        },
        video: {
          label: 'Video',
          type: 'string',
          colour: 'red',
        },
      };

      expect(created).toStrictEqual(expected);

      const expectedAfter = {
        lighting: {
          label: 'Lighting',
          type: 'string',
          colour: 'blue',
        },
        sound: {
          label: 'Sound',
          type: 'string',
          colour: 'green',
        },
        av: {
          label: 'AV',
          type: 'string',
          colour: 'red',
        },
      };

      // We need to flush all scheduled tasks for the generate function to settle
      vi.useFakeTimers();
      const customField = await editCustomField('video', { label: 'AV', type: 'string', colour: 'red' });
      expect(customField).toStrictEqual(expectedAfter);
      expect(customFieldChangelog).toStrictEqual(new Map([['video', 'av']]));
      await editCustomField('av', { label: 'video' });
      vi.runAllTimers();
      expect(customFieldChangelog).toStrictEqual(new Map());
      vi.useRealTimers();
    });
  });

  describe('removeCustomField()', () => {
    it('deletes a field with a given label', async () => {
      const expected = {
        lighting: {
          label: 'Lighting',
          type: 'string',
          colour: 'blue',
        },
        video: {
          label: 'video',
          type: 'string',
          colour: 'red',
        },
      };

      const customField = await removeCustomField('sound');

      expect(customField).toStrictEqual(expected);
    });
  });
});
