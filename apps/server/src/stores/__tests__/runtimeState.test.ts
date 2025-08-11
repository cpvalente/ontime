import { PlayableEvent, Playback, TimerPhase } from 'ontime-types';

import { makeOntimeGroup, makeOntimeEvent, makeRundown } from '../../api-data/rundown/__mocks__/rundown.mocks.js';
import { initRundown } from '../../api-data/rundown/rundown.service.js';

import {
  type RuntimeState,
  addTime,
  clearState,
  getState,
  load,
  loadGroupFlagAndEnd,
  pause,
  roll,
  start,
  stop,
} from '../runtimeState.js';
import { rundownCache } from '../../api-data/rundown/rundown.dao.js';
import { RundownMetadata } from '../../api-data/rundown/rundown.types.js';

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
  eventNext: null,
  rundown: {
    selectedEventIndex: null,
    numEvents: 0,
  },
  timer: {
    addedTime: 0,
    current: null,
    duration: null,
    elapsed: null,
    expectedFinish: null,
    playback: Playback.Stop,
    secondaryTimer: null,
    startedAt: null,
  },
  _timer: {
    pausedAt: null,
    hasFinished: false,
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
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime('jan 1 00:01');
  });
  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('playback operations', async () => {
    it('refuses if nothing is loaded', async () => {
      // force update
      await initRundown(makeRundown({}), {});
      vi.runAllTimers();

      let success = start(mockState);
      expect(success).toBe(false);

      success = pause();
      expect(success).toBe(false);
    });

    test('normal playback cycle', async () => {
      // 1. Load event
      const mockRundown = makeRundown({
        entries: { [mockEvent.id]: mockEvent, event2: { ...mockEvent, id: 'event2' } },
        order: [mockEvent.id, 'event2'],
      });
      // force update
      await initRundown(mockRundown, {});
      vi.runAllTimers();

      const { metadata, rundown } = rundownCache.get();
      load(mockEvent, rundown, metadata);
      let newState = getState();
      expect(newState.eventNow?.id).toBe(mockEvent.id);
      expect(newState.eventNext?.id).toBe('event2');
      expect(newState.timer.playback).toBe(Playback.Armed);
      expect(newState.clock).not.toBe(666);
      expect(newState.groupNow).toBeNull();

      // 2. Start event
      vi.setSystemTime('jan 1 00:02');
      let success = start();
      newState = getState();
      expect(success).toBe(true);
      expect(newState.timer).toMatchObject({
        playback: Playback.Play,
      });
      expect(newState.rundown.actualStart).toBe(newState.clock);

      // 3. Pause event
      vi.setSystemTime('jan 1 00:03');
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
      vi.setSystemTime('jan 1 00:04');
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
      vi.setSystemTime('jan 1 00:05');
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
      expect(newState.rundown.actualStart).toBeNull();
    });
  });

  test('runtime offset', async () => {
    const entries = {
      event1: { ...mockEvent, id: 'event1', timeStart: 0, timeEnd: 1000, duration: 1000, parent: null },
      event2: { ...mockEvent, id: 'event2', timeStart: 1000, timeEnd: 1500, duration: 500, parent: null },
    };
    const mockRundown = makeRundown({ entries, order: ['event1', 'event2'] });

    // force update
    await initRundown(mockRundown, {});
    vi.runAllTimers();

    const { metadata, rundown } = rundownCache.get();

    // 1. Load event
    vi.setSystemTime('jan 1 00:09');
    load(entries.event1, rundown, metadata);
    let newState = getState();
    expect(newState.rundown.actualStart).toBeNull();
    expect(newState.rundown.plannedStart).toBe(0);
    expect(newState.rundown.plannedEnd).toBe(1500);
    expect(newState.groupNow).toBeNull();
    expect(newState.runtime.offsetAbs).toBe(0);

    // 2. Start event
    vi.setSystemTime('jan 1 00:10');
    start();
    newState = getState();
    const firstStart = newState.clock;
    if (newState.runtime.offsetAbs === null) {
      throw new Error('Value cannot be null at this stage');
    }

    expect(newState.rundown.actualStart).toBe(newState.clock);
    expect(newState.runtime.offsetAbs).toBe(newState.clock - entries.event1.timeStart);
    expect(newState.runtime.expectedRundownEnd).toBe(entries.event2.timeEnd + newState.runtime.offsetAbs);

    // 3. Next event
    vi.setSystemTime('jan 1 00:12');
    load(entries.event2, rundown, metadata);
    start();

    newState = getState();
    if (newState.rundown.actualStart === null || newState.runtime.offsetAbs === null) {
      throw new Error('Value cannot be null at this stage');
    }

    // there is a case where the calculation time overflows the millisecond which makes
    // tests fail
    const forgivingActualStart = Math.abs(newState.rundown.actualStart - firstStart);
    expect(forgivingActualStart).toBeLessThanOrEqual(1);
    // we are over-under, the difference between the schedule and the actual start
    const delayBefore = newState.clock - entries.event2.timeStart;
    expect(newState.runtime.offsetAbs).toBe(delayBefore);
    // finish is the difference between the runtime and the schedule
    expect(newState.runtime.expectedRundownEnd).toBe(newState.runtime.offsetAbs + entries.event2.timeEnd);
    expect(newState.groupNow).toBeNull();

    // 4. Add time
    addTime(10);
    newState = getState();
    if (newState.runtime.offsetAbs === null) {
      throw new Error('Value cannot be null at this stage');
    }

    expect(newState.runtime.offsetAbs).toBe(delayBefore + 10);
    expect(newState.runtime.expectedRundownEnd).toBe(entries.event2.timeEnd + newState.runtime.offsetAbs);

    // 5. Stop event
    stop();
    newState = getState();
    expect(newState.rundown.actualStart).toBeNull();
    expect(newState.runtime.offsetAbs).toBe(0);
    expect(newState.runtime.expectedRundownEnd).toBeNull();
  });
});

describe('roll mode', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime('jan 1 00:00');
    clearState();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('normal roll', async () => {
    beforeEach(async () => {
      vi.useFakeTimers();
      const mockRundown = makeRundown({
        entries: {
          1: { ...mockEvent, id: '1', timeStart: 1000, duration: 1000, timeEnd: 2000 },
          2: { ...mockEvent, id: '2', timeStart: 2000, duration: 1000, timeEnd: 3000 },
          3: { ...mockEvent, id: '3', timeStart: 3000, duration: 1000, timeEnd: 4000 },
        },
        order: ['1', '2', '3'],
      });
      await initRundown(mockRundown, {});
      vi.runAllTimers();
    });

    test('pending event', () => {
      const { rundown, metadata } = rundownCache.get();
      const { eventId, didStart } = roll(rundown, metadata);
      const state = getState();

      expect(eventId).toBe('1');
      expect(didStart).toBe(false);
      expect(state.timer.phase).toBe(TimerPhase.Pending);
      expect(state.timer.secondaryTimer).toBe(1000);
    });

    test('roll events', () => {
      vi.setSystemTime('jan 1 00:00:01');
      const { rundown, metadata } = rundownCache.get();
      let result = roll(rundown, metadata);
      expect(result).toStrictEqual({ eventId: '1', didStart: true });

      vi.setSystemTime('jan 1 00:00:02');
      result = roll(rundown, metadata);
      expect(result).toStrictEqual({ eventId: '2', didStart: true });

      vi.setSystemTime('jan 1 00:00:03:500');
      result = roll(rundown, metadata);
      expect(result).toStrictEqual({ eventId: '3', didStart: true });
    });
  });

  describe('roll takeover', () => {
    beforeEach(async () => {
      const rundown = makeRundown({
        entries: {
          1: { ...mockEvent, id: '1', timeStart: 1000, duration: 1000, timeEnd: 2000 },
          2: { ...mockEvent, id: '2', timeStart: 2000, duration: 1000, timeEnd: 3000 },
          3: { ...mockEvent, id: '3', timeStart: 3000, duration: 1000, timeEnd: 4000 },
        },
        order: ['1', '2', '3'],
      });

      // force update
      vi.useFakeTimers();
      await initRundown(rundown, {});
      vi.runAllTimers();
    });

    test('from load', () => {
      const { rundown, metadata } = rundownCache.get();
      load(rundown.entries[3] as PlayableEvent, rundown, metadata);
      const result = roll(rundown, metadata);
      expect(result).toStrictEqual({ eventId: '3', didStart: false });
      const state = getState();
      expect(state.timer.phase).toBe(TimerPhase.Pending);
      expect(state.timer.secondaryTimer).toBe(3000);
    });

    test('from play', () => {
      const { rundown, metadata } = rundownCache.get();
      load(rundown.entries[1] as PlayableEvent, rundown, metadata);
      start();
      const result = roll(rundown, metadata);
      expect(result).toStrictEqual({ eventId: '1', didStart: false });
      expect(getState().runtime.offsetAbs).toBe(-1000);
    });
  });

  describe('roll continue with offset', () => {
    test('no gaps', async () => {
      const mockRundown = makeRundown({
        entries: {
          1: { ...mockEvent, id: '1', timeStart: 1000, duration: 1000, timeEnd: 2000 },
          2: { ...mockEvent, id: '2', timeStart: 2000, duration: 1000, timeEnd: 3000 },
          3: { ...mockEvent, id: '3', timeStart: 3000, duration: 1000, timeEnd: 4000 },
        },
        order: ['1', '2', '3'],
      });

      // force update
      vi.useFakeTimers();
      await initRundown(mockRundown, {});
      vi.runAllTimers();
      const { rundown, metadata } = rundownCache.get();

      load(rundown.entries[1] as PlayableEvent, rundown, metadata);
      start();
      // the current offset after manual play
      const currentOffset = getState().runtime.offsetAbs;
      let result = roll(rundown, metadata, getState().runtime.offsetAbs);
      expect(result).toStrictEqual({ eventId: '1', didStart: false });
      // the current offset should be maintain by roll mode when taking over from play
      expect(getState().runtime.offsetAbs).toBe(currentOffset);

      vi.setSystemTime('jan 1 00:00:01');
      result = roll(rundown, metadata, getState().runtime.offsetAbs);
      expect(result).toStrictEqual({ eventId: '2', didStart: true });
      expect(getState().runtime.offsetAbs).toBe(-1000);

      vi.setSystemTime('jan 1 00:00:02');
      result = roll(rundown, metadata, getState().runtime.offsetAbs);
      expect(result).toStrictEqual({ eventId: '3', didStart: true });
      expect(getState().runtime.offsetAbs).toBe(-1000);

      vi.useRealTimers();
    });
  });
});

describe('loadGroupFlagAndEnd', () => {
  test('from no-group to a group will clear expectedGroupEnd', () => {
    const rundown = makeRundown({
      entries: {
        0: makeOntimeEvent({ id: '0', parent: null }),
        1: makeOntimeGroup({ id: '1', entries: ['11'] }),
        11: makeOntimeEvent({ id: '11', parent: '1' }),
        2: makeOntimeGroup({ id: '2', entries: [] }),
        3: makeOntimeEvent({ id: '3', parent: null }),
      },
      order: ['0', '1', '2', '3'],
    });

    const state = {
      groupNow: null,
      eventNow: rundown.entries[11],
      runtime: { expectedGroupEnd: 123 },
    } as RuntimeState;

    const metadata = { playableEventOrder: ['0', '11', '3'], flags: ['1'] } as RundownMetadata;

    loadGroupFlagAndEnd(rundown, metadata, 2, state);

    expect(state).toMatchObject({
      groupNow: rundown.entries[1],
      runtime: { expectedGroupEnd: null },
      eventNow: rundown.entries[11],
    });
  });

  test('from a group to a different group will clear expectedGroupEnd', () => {
    const rundown = makeRundown({
      entries: {
        0: makeOntimeEvent({ id: '0', parent: null }),
        1: makeOntimeGroup({ id: '1', entries: ['11'] }),
        11: makeOntimeEvent({ id: '11', parent: '1' }),
        2: makeOntimeGroup({ id: '2', entries: ['22'] }),
        22: makeOntimeEvent({ id: '22', parent: '2' }),
      },
      order: ['0', '1', '2'],
    });

    const state = {
      groupNow: rundown.entries[1],
      runtime: { expectedGroupEnd: 123 },
      eventNow: rundown.entries[22],
    } as RuntimeState;

    const metadata = { playableEventOrder: ['0', '11', '22'], flags: ['1'] } as RundownMetadata;

    loadGroupFlagAndEnd(rundown, metadata, 1, state);

    expect(state).toMatchObject({
      groupNow: rundown.entries[2],
      runtime: { expectedGroupEnd: null },
      eventNow: rundown.entries[22],
    });
  });

  test('from group to a no-group will clear expectedGroupEnd', () => {
    const rundown = makeRundown({
      entries: {
        0: makeOntimeEvent({ id: '0', parent: null }),
        1: makeOntimeGroup({ id: '1', entries: ['11'] }),
        11: makeOntimeEvent({ id: '11', parent: '1' }),
        2: makeOntimeGroup({ id: '2', entries: ['22'] }),
        22: makeOntimeEvent({ id: '22', parent: '2' }),
      },
      order: ['0', '1', '2'],
    });

    const state = {
      groupNow: rundown.entries[1],
      runtime: { expectedGroupEnd: 123 },
      eventNow: rundown.entries[0],
    } as RuntimeState;

    const metadata = { playableEventOrder: ['0', '11', '22'], flags: ['1'] } as RundownMetadata;

    loadGroupFlagAndEnd(rundown, metadata, 1, state);

    expect(state).toMatchObject({
      groupNow: null,
      runtime: { expectedGroupEnd: null },
      eventNow: rundown.entries[0],
    });
  });

  test('from no-group to no-group will keep startedAt', () => {
    const rundown = makeRundown({
      entries: {
        0: makeOntimeEvent({ id: '0', parent: null }),
        1: makeOntimeEvent({ id: '1', parent: null }),
      },
      order: ['0', '1'],
    });

    const state = {
      groupNow: null,
      eventNow: rundown.entries[0],
    } as RuntimeState;

    const metadata = { playableEventOrder: ['0', '1'], flags: ['1'] } as RundownMetadata;

    loadGroupFlagAndEnd(rundown, metadata, 0, state);

    expect(state).toMatchObject({
      groupNow: null,
      eventNow: rundown.entries[0],
    });
  });
});
