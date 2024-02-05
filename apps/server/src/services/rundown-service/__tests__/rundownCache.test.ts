import { EndAction, OntimeEvent, OntimeRundown, SupportedEvent, TimerType } from 'ontime-types';

import { calculateRuntimeDelays, getDelayAt, calculateRuntimeDelaysFrom } from '../delayUtils.js';
import { add, batchEdit, edit, remove, reorder, swap } from '../rundownCache.js';

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
