import { PlayableEvent, Playback, TimerPhase } from 'ontime-types';

import { initRundown } from '../../services/rundown-service/RundownService.js';
import {
  makeOntimeBlock,
  makeOntimeEvent,
  makeRundown,
} from '../../services/rundown-service/__mocks__/rundown.mocks.js';

import {
  type RuntimeState,
  addTime,
  clear,
  getState,
  load,
  loadBlock,
  pause,
  roll,
  start,
  stop,
} from '../runtimeState.js';

const mockEvent = {
  type: 'event',
  id: 'mock',
  cue: 'mock',
  timeStart: 0,
  timeEnd: 1000,
  duration: 1000,
  skip: false,
  parent: null,
} as PlayableEvent;

const mockState = {
  clock: 666,
  eventNow: null,
  publicEventNow: null,
  eventNext: null,
  publicEventNext: null,
  runtime: {
    selectedEventIndex: null,
    numEvents: 0,
  },
  timer: {
    addedTime: 0,
    current: null,
    duration: null,
    elapsed: null,
    expectedFinish: null,
    finishedAt: null,
    playback: Playback.Stop,
    secondaryTimer: null,
    startedAt: null,
  },
  _timer: {
    pausedAt: null,
  },
} as RuntimeState;

beforeAll(() => {
  vi.mock('../../classes/data-provider/DataProvider.js', () => {
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

describe('mutation on runtimeState', () => {
  beforeEach(async () => {
    clear();
    vi.mock('../../services/rundown-service/RundownService.js', async (importOriginal) => {
      const actual = (await importOriginal()) as object;

      return {
        ...actual,
        initRunddown: vi.fn().mockReturnValue(undefined),
      };
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('playback operations', async () => {
    it('refuses if nothing is loaded', () => {
      initRundown(makeRundown({}), {});
      let success = start(mockState);
      expect(success).toBe(false);

      success = pause();
      expect(success).toBe(false);
    });

    test('normal playback cycle', () => {
      // 1. Load event
      const mockRundown = makeRundown({ entries: { [mockEvent.id]: mockEvent }, order: [mockEvent.id] });
      load(mockEvent, mockRundown, mockRundown.order);
      let newState = getState();
      expect(newState.eventNow?.id).toBe(mockEvent.id);
      expect(newState.timer.playback).toBe(Playback.Armed);
      expect(newState.clock).not.toBe(666);
      expect(newState.currentBlock.block).toBeNull();

      // 2. Start event
      let success = start();
      newState = getState();
      expect(success).toBe(true);
      expect(newState.timer).toMatchObject({
        playback: Playback.Play,
      });
      expect(newState.runtime.actualStart).toBe(newState.clock);

      // 3. Pause event
      success = pause();
      newState = getState();
      expect(success).toBe(true);
      expect(newState.clock).not.toBe(666);
      expect(newState.timer).toMatchObject({
        playback: Playback.Pause,
        addedTime: 0,
      });
      expect(newState._timer.pausedAt).toEqual(newState.clock);

      success = pause();
      expect(success).toBe(false);

      // 4. Restart event
      success = start();
      newState = getState();
      expect(success).toBe(true);
      expect(newState.timer).toMatchObject({
        playback: Playback.Play,
        secondaryTimer: null,
      });
      expect(newState.timer).toEqual(
        expect.objectContaining({
          current: expect.any(Number),
          duration: expect.any(Number),
          elapsed: expect.any(Number),
          expectedFinish: expect.any(Number),
          startedAt: expect.any(Number),
        }),
      );
      expect(newState._timer.pausedAt).toBeNull();

      // 5. Stop event
      success = stop();
      newState = getState();
      expect(success).toBe(true);
      expect(newState.eventNow).toBe(null);
      expect(newState.timer).toMatchObject({
        playback: Playback.Stop,
        duration: null,
        elapsed: null,
        expectedFinish: null,
        startedAt: null,
      });
      expect(newState.runtime.actualStart).toBeNull();
    });

    // do this before the test so that it is applied
    const entries = {
      event1: { ...mockEvent, id: 'event1', timeStart: 0, timeEnd: 1000, duration: 1000, parent: null },
      event2: { ...mockEvent, id: 'event2', timeStart: 1000, timeEnd: 1500, duration: 500, parent: null },
    };
    const rundown = makeRundown({ entries, order: ['event1', 'event2'] });

    // force update
    vi.useFakeTimers();
    await initRundown(rundown, {});
    vi.runAllTimers();
    vi.useRealTimers();

    test('runtime offset', async () => {
      // 1. Load event
      load(entries.event1, rundown, rundown.order);
      let newState = getState();
      expect(newState.runtime.actualStart).toBeNull();
      expect(newState.runtime.plannedStart).toBe(0);
      expect(newState.runtime.plannedEnd).toBe(1500);
      expect(newState.currentBlock.block).toBeNull();
      expect(newState.runtime.offset).toBe(0);

      // 2. Start event
      start();
      newState = getState();
      const firstStart = newState.clock;
      if (newState.runtime.offset === null) {
        throw new Error('Value cannot be null at this stage');
      }

      expect(newState.runtime.actualStart).toBe(newState.clock);
      expect(newState.runtime.offset).toBe(entries.event1.timeStart - newState.clock);
      expect(newState.runtime.expectedEnd).toBe(entries.event2.timeEnd - newState.runtime.offset);

      // 3. Next event
      load(entries.event2, rundown, rundown.order);
      start();

      newState = getState();
      if (newState.runtime.actualStart === null || newState.runtime.offset === null) {
        throw new Error('Value cannot be null at this stage');
      }

      // there is a case where the calculation time overflows the millisecond which makes
      // tests fail
      const forgivingActualStart = Math.abs(newState.runtime.actualStart - firstStart);
      expect(forgivingActualStart).toBeLessThanOrEqual(1);
      // we are over-under, the difference between the schedule and the actual start
      const delayBefore = entries.event2.timeStart - newState.clock;
      expect(newState.runtime.offset).toBe(delayBefore);
      // finish is the difference between the runtime and the schedule
      expect(newState.runtime.expectedEnd).toBe(entries.event2.timeEnd - newState.runtime.offset);
      expect(newState.currentBlock.block).toBeNull();

      // 4. Add time
      addTime(10);
      newState = getState();
      if (newState.runtime.offset === null) {
        throw new Error('Value cannot be null at this stage');
      }

      expect(newState.runtime.offset).toBe(delayBefore - 10);
      expect(newState.runtime.expectedEnd).toBe(entries.event2.timeEnd - newState.runtime.offset);

      // 5. Stop event
      stop();
      newState = getState();
      expect(newState.runtime.actualStart).toBeNull();
      expect(newState.runtime.offset).toBe(0);
      expect(newState.runtime.expectedEnd).toBeNull();
    });
  });
});

describe('roll mode', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime('jan 1 00:00');
    clear();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('normal roll', () => {
    const rundown = makeRundown({
      entries: {
        1: { ...mockEvent, id: '1', timeStart: 1000, duration: 1000, timeEnd: 2000 },
        2: { ...mockEvent, id: '2', timeStart: 2000, duration: 1000, timeEnd: 3000 },
        3: { ...mockEvent, id: '3', timeStart: 3000, duration: 1000, timeEnd: 4000 },
      },
      order: ['1', '2', '3'],
    });

    test('pending event', () => {
      const { eventId, didStart } = roll(rundown, rundown.order);
      const state = getState();

      expect(eventId).toBe('1');
      expect(didStart).toBe(false);
      expect(state.timer.phase).toBe(TimerPhase.Pending);
      expect(state.timer.secondaryTimer).toBe(1000);
    });

    test('roll events', () => {
      vi.setSystemTime('jan 1 00:00:01');
      let result = roll(rundown, rundown.order);
      expect(result).toStrictEqual({ eventId: '1', didStart: true });

      vi.setSystemTime('jan 1 00:00:02');
      result = roll(rundown, rundown.order);
      expect(result).toStrictEqual({ eventId: '2', didStart: true });

      vi.setSystemTime('jan 1 00:00:03:500');
      result = roll(rundown, rundown.order);
      expect(result).toStrictEqual({ eventId: '3', didStart: true });
    });
  });

  describe('roll takover', () => {
    const rundown = makeRundown({
      entries: {
        1: { ...mockEvent, id: '1', timeStart: 1000, duration: 1000, timeEnd: 2000 },
        2: { ...mockEvent, id: '2', timeStart: 2000, duration: 1000, timeEnd: 3000 },
        3: { ...mockEvent, id: '3', timeStart: 3000, duration: 1000, timeEnd: 4000 },
      },
      order: ['1', '2', '3'],
    });

    test('from load', () => {
      load(rundown.entries[3] as PlayableEvent, rundown, rundown.order);
      const result = roll(rundown, rundown.order);
      expect(result).toStrictEqual({ eventId: '3', didStart: false });
      const state = getState();
      expect(state.timer.phase).toBe(TimerPhase.Pending);
      expect(state.timer.secondaryTimer).toBe(3000);
    });

    test('from play', () => {
      load(rundown.entries[1] as PlayableEvent, rundown, rundown.order);
      start();
      const result = roll(rundown, rundown.order);
      expect(result).toStrictEqual({ eventId: '1', didStart: false });
      expect(getState().runtime.offset).toBe(1000);
    });
  });

  describe('roll continue with offset', () => {
    test('no gaps', () => {
      const rundown = makeRundown({
        entries: {
          1: { ...mockEvent, id: '1', timeStart: 1000, duration: 1000, timeEnd: 2000 },
          2: { ...mockEvent, id: '2', timeStart: 2000, duration: 1000, timeEnd: 3000 },
          3: { ...mockEvent, id: '3', timeStart: 3000, duration: 1000, timeEnd: 4000 },
        },
        order: ['1', '2', '3'],
      });

      load(rundown.entries[1] as PlayableEvent, rundown, rundown.order);
      start();
      let result = roll(rundown, rundown.order, getState().runtime.offset);
      expect(result).toStrictEqual({ eventId: '1', didStart: false });
      expect(getState().runtime.offset).toBe(1000);

      vi.setSystemTime('jan 1 00:00:01');
      result = roll(rundown, rundown.order, getState().runtime.offset);
      expect(result).toStrictEqual({ eventId: '2', didStart: true });
      expect(getState().runtime.offset).toBe(1000);

      vi.setSystemTime('jan 1 00:00:02');
      result = roll(rundown, rundown.order, getState().runtime.offset);
      expect(result).toStrictEqual({ eventId: '3', didStart: true });
      expect(getState().runtime.offset).toBe(1000);
    });
  });
});

describe('loadBlock', () => {
  test('from no-block to a block will clear startedAt', () => {
    const rundown = makeRundown({
      entries: {
        0: makeOntimeEvent({ id: '0', parent: null }),
        1: makeOntimeBlock({ id: '1', events: ['11'] }),
        11: makeOntimeEvent({ id: '11', parent: '1' }),
        2: makeOntimeBlock({ id: '2', events: [] }),
        3: makeOntimeEvent({ id: '3', parent: null }),
      },
      order: ['0', '1', '2', '3'],
    });

    const state = {
      currentBlock: {
        block: null,
        startedAt: 123,
      },
      eventNow: rundown.entries[11],
    } as RuntimeState;

    loadBlock(rundown, state);

    expect(state).toMatchObject({
      currentBlock: { block: rundown.entries[1], startedAt: null },
      eventNow: rundown.entries[11],
    });
  });

  test('from block to a different block will clear startedAt', () => {
    const rundown = makeRundown({
      entries: {
        0: makeOntimeEvent({ id: '0', parent: null }),
        1: makeOntimeBlock({ id: '1', events: ['11'] }),
        11: makeOntimeEvent({ id: '11', parent: '1' }),
        2: makeOntimeBlock({ id: '2', events: ['22'] }),
        22: makeOntimeEvent({ id: '22', parent: '2' }),
      },
      order: ['0', '1', '2'],
    });

    const state = {
      currentBlock: {
        block: rundown.entries[1],
        startedAt: 123,
      },
      eventNow: rundown.entries[22],
    } as RuntimeState;

    loadBlock(rundown, state);

    expect(state).toMatchObject({
      currentBlock: { block: rundown.entries[2], startedAt: null },
      eventNow: rundown.entries[22],
    });
  });

  test('from block to a no-block will clear startedAt', () => {
    const rundown = makeRundown({
      entries: {
        0: makeOntimeEvent({ id: '0', parent: null }),
        1: makeOntimeBlock({ id: '1', events: ['11'] }),
        11: makeOntimeEvent({ id: '11', parent: '1' }),
        2: makeOntimeBlock({ id: '2', events: ['22'] }),
        22: makeOntimeEvent({ id: '22', parent: '2' }),
      },
      order: ['0', '1', '2'],
    });

    const state = {
      currentBlock: {
        block: rundown.entries[1],
        startedAt: 123,
      },
      eventNow: rundown.entries[0],
    } as RuntimeState;

    loadBlock(rundown, state);

    expect(state).toMatchObject({
      currentBlock: { block: null, startedAt: null },
      eventNow: rundown.entries[0],
    });
  });

  test('from block to same block will keep startedAt', () => {
    const rundown = makeRundown({
      entries: {
        0: makeOntimeBlock({ id: '0', events: ['1', '2'] }),
        1: makeOntimeEvent({ id: '1', parent: '0' }),
        2: makeOntimeEvent({ id: '2', parent: '0' }),
      },
      order: ['0'],
    });

    const state = {
      currentBlock: {
        block: rundown.entries[0],
        startedAt: 123,
      },
      eventNow: rundown.entries[2],
    } as RuntimeState;

    loadBlock(rundown, state);

    expect(state).toMatchObject({
      currentBlock: { block: rundown.entries[0], startedAt: 123 },
      eventNow: rundown.entries[2],
    });
  });

  test('from no-block to no-block will keep startedAt', () => {
    const rundown = makeRundown({
      entries: {
        0: makeOntimeEvent({ id: '0', parent: null }),
        1: makeOntimeEvent({ id: '1', parent: null }),
      },
      order: ['0', '1'],
    });

    const state = {
      currentBlock: {
        block: null,
        startedAt: 123,
      },
      eventNow: rundown.entries[0],
    } as RuntimeState;

    loadBlock(rundown, state);

    expect(state).toMatchObject({
      currentBlock: { block: null, startedAt: 123 },
      eventNow: rundown.entries[0],
    });
  });
});
