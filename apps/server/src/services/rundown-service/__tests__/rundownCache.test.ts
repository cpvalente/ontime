import {
  EndAction,
  OntimeBlock,
  OntimeDelay,
  OntimeEvent,
  OntimeRundown,
  SupportedEvent,
  TimeStrategy,
  TimerType,
} from 'ontime-types';

import { calculateRuntimeDelays, getDelayAt, calculateRuntimeDelaysFrom } from '../delayUtils.js';
import { add, batchEdit, edit, generate, remove, reorder, swap } from '../rundownCache.js';

describe('init() function', () => {
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
      { type: SupportedEvent.Event, id: '2', timeStart: 1 } as OntimeEvent,
      { type: SupportedEvent.Block, id: '3' } as OntimeBlock,
      { type: SupportedEvent.Event, id: '4', timeStart: 2 } as OntimeEvent,
    ];

    const initResult = generate(testRundown);
    expect(initResult.order.length).toBe(4);
    expect((initResult.rundown['2'] as OntimeEvent).delay).toBe(100);
    expect((initResult.rundown['4'] as OntimeEvent).delay).toBe(0);
  });

  it('links times across events', () => {
    const testRundown: OntimeRundown = [
      { type: SupportedEvent.Event, id: '1', timeStart: 1, timeEnd: 2 } as OntimeEvent,
      { type: SupportedEvent.Event, id: '2', timeStart: 11, timeEnd: 12, linkStart: '1' } as OntimeEvent,
      { type: SupportedEvent.Block, id: 'block' } as OntimeBlock,
      { type: SupportedEvent.Delay, id: 'delay' } as OntimeDelay,
      { type: SupportedEvent.Event, id: '3', timeStart: 21, timeEnd: 22, linkStart: '2' } as OntimeEvent,
    ];

    const initResult = generate(testRundown);
    expect(initResult.order.length).toBe(5);
    expect((initResult.rundown['2'] as OntimeEvent).timeStart).toBe(2);
    expect((initResult.rundown['3'] as OntimeEvent).timeStart).toBe(12);
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
    expect((initResult.rundown['2'] as OntimeEvent).timeStart).toBe(22);
    expect((initResult.rundown['3'] as OntimeEvent).timeStart).toBe(2);
    expect(initResult.links['1']).toBe('3');
    expect(initResult.links['3']).toBe('2');
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
    const { newRundown } = remove({ eventId: mockEvent.id, persistedRundown: testRundown });
    expect(newRundown.length).toBe(0);
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
        subtitle: '',
        presenter: '',
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
        user0: '',
        user1: '',
        user2: '',
        user3: '',
        user4: '',
        user5: '',
        user6: '',
        user7: '',
        user8: '',
        user9: '',
        type: SupportedEvent.Event,
        revision: 0,
        timeWarning: 120000,
        timeDanger: 60000,
        id: '659e1',
        cue: '1',
      },
      {
        duration: 600000,
        type: SupportedEvent.Delay,
        id: '07986',
      },
      {
        title: '',
        subtitle: '',
        presenter: '',
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
        user0: '',
        user1: '',
        user2: '',
        user3: '',
        user4: '',
        user5: '',
        user6: '',
        user7: '',
        user8: '',
        user9: '',
        type: SupportedEvent.Event,
        revision: 0,
        timeWarning: 120000,
        timeDanger: 60000,
        id: '1c48f',
        cue: '2',
      },
      {
        duration: 1200000,
        type: SupportedEvent.Delay,
        id: '7db42',
      },
      {
        title: '',
        subtitle: '',
        presenter: '',
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
        user0: '',
        user1: '',
        user2: '',
        user3: '',
        user4: '',
        user5: '',
        user6: '',
        user7: '',
        user8: '',
        user9: '',
        type: SupportedEvent.Event,
        revision: 0,
        timeWarning: 120000,
        timeDanger: 60000,
        id: 'd48c2',
        cue: '3',
      },
      {
        title: '',
        type: SupportedEvent.Block,
        id: '9870d',
      },
      {
        title: '',
        subtitle: '',
        presenter: '',
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
        user0: '',
        user1: '',
        user2: '',
        user3: '',
        user4: '',
        user5: '',
        user6: '',
        user7: '',
        user8: '',
        user9: '',
        type: SupportedEvent.Event,
        revision: 0,
        timeWarning: 120000,
        timeDanger: 60000,
        id: '2f185',
        cue: '4',
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
      subtitle: '',
      presenter: '',
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
      user0: '',
      user1: '',
      user2: '',
      user3: '',
      user4: '',
      user5: '',
      user6: '',
      user7: '',
      user8: '',
      user9: '',
      type: SupportedEvent.Event,
      revision: 0,
      timeWarning: 120000,
      timeDanger: 60000,
      id: '659e1',
      delay: 0,
      cue: '1',
    },
    {
      duration: 600000,
      type: SupportedEvent.Delay,
      id: '07986',
    },
    {
      title: '',
      subtitle: '',
      presenter: '',
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
      user0: '',
      user1: '',
      user2: '',
      user3: '',
      user4: '',
      user5: '',
      user6: '',
      user7: '',
      user8: '',
      user9: '',
      type: SupportedEvent.Event,
      revision: 0,
      timeWarning: 120000,
      timeDanger: 60000,
      id: '1c48f',
      delay: 600000,
      cue: '2',
    },
    {
      duration: 1200000,
      type: SupportedEvent.Delay,
      id: '7db42',
    },
    {
      title: '',
      subtitle: '',
      presenter: '',
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
      user0: '',
      user1: '',
      user2: '',
      user3: '',
      user4: '',
      user5: '',
      user6: '',
      user7: '',
      user8: '',
      user9: '',
      type: SupportedEvent.Event,
      revision: 0,
      timeWarning: 120000,
      timeDanger: 60000,
      id: 'd48c2',
      delay: 1800000,
      cue: '3',
    },
    {
      title: '',
      type: SupportedEvent.Block,
      id: '9870d',
    },
    {
      title: '',
      subtitle: '',
      presenter: '',
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
      user0: '',
      user1: '',
      user2: '',
      user3: '',
      user4: '',
      user5: '',
      user6: '',
      user7: '',
      user8: '',
      user9: '',
      type: SupportedEvent.Event,
      revision: 0,
      timeWarning: 120000,
      timeDanger: 60000,
      id: '2f185',
      delay: 0,
      cue: '4',
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
        subtitle: '',
        presenter: '',
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
        user0: '',
        user1: '',
        user2: '',
        user3: '',
        user4: '',
        user5: '',
        user6: '',
        user7: '',
        user8: '',
        user9: '',
        type: SupportedEvent.Event,
        revision: 0,
        timeWarning: 120000,
        timeDanger: 60000,
        id: '659e1',
        delay: 0,
        cue: '1',
      },
      {
        duration: 600000,
        type: SupportedEvent.Delay,
        id: '07986',
      },
      {
        title: '',
        subtitle: '',
        presenter: '',
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
        user0: '',
        user1: '',
        user2: '',
        user3: '',
        user4: '',
        user5: '',
        user6: '',
        user7: '',
        user8: '',
        user9: '',
        type: SupportedEvent.Event,
        revision: 0,
        timeWarning: 120000,
        timeDanger: 60000,
        id: '1c48f',
        delay: 0,
        cue: '2',
      },
      {
        duration: 1200000,
        type: SupportedEvent.Delay,
        id: '7db42',
      },
      {
        title: '',
        subtitle: '',
        presenter: '',
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
        user0: '',
        user1: '',
        user2: '',
        user3: '',
        user4: '',
        user5: '',
        user6: '',
        user7: '',
        user8: '',
        user9: '',
        type: SupportedEvent.Event,
        revision: 0,
        timeWarning: 120000,
        timeDanger: 60000,
        id: 'd48c2',
        delay: 1800000,
        cue: '3',
      },
      {
        title: '',
        type: SupportedEvent.Block,
        id: '9870d',
      },
      {
        title: '',
        subtitle: '',
        presenter: '',
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
        user0: '',
        user1: '',
        user2: '',
        user3: '',
        user4: '',
        user5: '',
        user6: '',
        user7: '',
        user8: '',
        user9: '',
        type: SupportedEvent.Event,
        revision: 0,
        timeWarning: 120000,
        timeDanger: 60000,
        id: '2f185',
        delay: 0,
        cue: '4',
      },
    ];

    const updatedRundown = calculateRuntimeDelaysFrom('07986', delayedRundown);

    // we only update from the 4th on
    expect((updatedRundown[0] as OntimeEvent).delay).toBe(0);
    // 1 + 3
    expect((updatedRundown[4] as OntimeEvent).delay).toBe(600000 + 1200000);
  });
});
