import { PlayableEvent, Playback, TimerPhase } from 'ontime-types';
import { deepmerge } from 'ontime-utils';

import { RuntimeState, addTime, clear, getState, load, pause, roll, start, stop } from '../runtimeState.js';
import { initRundown } from '../../services/rundown-service/RundownService.js';

const mockEvent = {
  type: 'event',
  id: 'mock',
  cue: 'mock',
  timeStart: 0,
  timeEnd: 1000,
  duration: 1000,
  skip: false,
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const makeMockState = (patch: RuntimeState): RuntimeState => {
  return deepmerge(mockState, patch);
};

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
    clear();

    vi.mock('../../services/rundown-service/RundownService.js', async (importOriginal) => {
      const actual = (await importOriginal()) as object;

      return {
        ...actual,
        getPlayableEvents: vi.fn().mockReturnValue([
          {
            id: 'mock',
            cue: 'mock',
            timeStart: 0,
            timeEnd: 1000,
            duration: 1000,
          },
        ]),
      };
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('playback operations', async () => {
    it('refuses if nothing is loaded', () => {
      let success = start(mockState);
      expect(success).toBe(false);

      success = pause();
      expect(success).toBe(false);
    });
    test('normal playback cycle', () => {
      // 1. Load event
      load(mockEvent, [mockEvent]);
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
    const event1 = { ...mockEvent, id: 'event1', timeStart: 0, timeEnd: 1000, duration: 1000 };
    const event2 = { ...mockEvent, id: 'event2', timeStart: 1000, timeEnd: 1500, duration: 500 };
    // force update
    vi.useFakeTimers();
    await initRundown([event1, event2], {});
    vi.runAllTimers();
    vi.useRealTimers();

    test('runtime offset', async () => {
      // 1. Load event
      load(event1, [event1, event2]);
      let newState = getState();
      expect(newState.runtime.actualStart).toBeNull();
      expect(newState.runtime.plannedStart).toBe(0);
      expect(newState.runtime.plannedEnd).toBe(1500);
      expect(newState.currentBlock.block).toBeNull();

      // 2. Start event
      start();
      newState = getState();
      const firstStart = newState.clock;
      if (newState.runtime.offset === null) {
        throw new Error('Value cannot be null at this stage');
      }

      expect(newState.runtime.actualStart).toBe(newState.clock);
      expect(newState.runtime.offset).toBe(event1.timeStart - newState.clock);
      expect(newState.runtime.expectedEnd).toBe(event2.timeEnd - newState.runtime.offset);

      // 3. Next event
      load(event2, [event1, event2]);
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
      const delayBefore = event2.timeStart - newState.clock;
      expect(newState.runtime.offset).toBe(delayBefore);
      // finish is the difference between the runtime and the schedule
      expect(newState.runtime.expectedEnd).toBe(event2.timeEnd - newState.runtime.offset);
      expect(newState.currentBlock.block).toBeNull();

      // 4. Add time
      addTime(10);
      newState = getState();
      if (newState.runtime.offset === null) {
        throw new Error('Value cannot be null at this stage');
      }

      expect(newState.runtime.offset).toBe(delayBefore - 10);
      expect(newState.runtime.expectedEnd).toBe(event2.timeEnd - newState.runtime.offset);

      // 5. Stop event
      stop();
      newState = getState();
      expect(newState.runtime.actualStart).toBeNull();
      expect(newState.runtime.offset).toBe(0);
      expect(newState.runtime.expectedEnd).toBeNull();
    });

    test.todo('runtime offset on timers in overtime', () => {});
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
    const rundown = [
      { ...mockEvent, id: '1', timeStart: 1000, duration: 1000, timeEnd: 2000 },
      { ...mockEvent, id: '2', timeStart: 2000, duration: 1000, timeEnd: 3000 },
      { ...mockEvent, id: '3', timeStart: 3000, duration: 1000, timeEnd: 4000 },
    ] as PlayableEvent[];

    test('pending event', () => {
      const { eventId, didStart } = roll(rundown);
      const state = getState();

      expect(eventId).toBe('1');
      expect(didStart).toBe(false);
      expect(state.timer.phase).toBe(TimerPhase.Pending);
      expect(state.timer.secondaryTimer).toBe(1000);
    });

    test('roll events', () => {
      vi.setSystemTime('jan 1 00:00:01');
      let result = roll(rundown);
      expect(result).toStrictEqual({ eventId: '1', didStart: true });

      vi.setSystemTime('jan 1 00:00:02');
      result = roll(rundown);
      expect(result).toStrictEqual({ eventId: '2', didStart: true });

      vi.setSystemTime('jan 1 00:00:03:500');
      result = roll(rundown);
      expect(result).toStrictEqual({ eventId: '3', didStart: true });
    });
  });

  describe('roll takover', () => {
    const rundown = [
      { ...mockEvent, id: '1', timeStart: 1000, duration: 1000, timeEnd: 2000 },
      { ...mockEvent, id: '2', timeStart: 2000, duration: 1000, timeEnd: 3000 },
      { ...mockEvent, id: '3', timeStart: 3000, duration: 1000, timeEnd: 4000 },
    ] as PlayableEvent[];

    test('from load', () => {
      load(rundown[2], rundown);
      const result = roll(rundown);
      expect(result).toStrictEqual({ eventId: '3', didStart: false });
      const state = getState();
      expect(state.timer.phase).toBe(TimerPhase.Pending);
      expect(state.timer.secondaryTimer).toBe(3000);
    });

    test('from play', () => {
      load(rundown[0], rundown);
      start();
      const result = roll(rundown);
      expect(result).toStrictEqual({ eventId: '1', didStart: false });
      expect(getState().runtime.offset).toBe(1000);
    });
  });

  describe('roll continue with offset', () => {
    test('no gaps', () => {
      const rundown = [
        { ...mockEvent, id: '1', timeStart: 1000, duration: 1000, timeEnd: 2000 },
        { ...mockEvent, id: '2', timeStart: 2000, duration: 1000, timeEnd: 3000 },
        { ...mockEvent, id: '3', timeStart: 3000, duration: 1000, timeEnd: 4000 },
      ] as PlayableEvent[];

      load(rundown[0], rundown);
      start();
      let result = roll(rundown, getState().runtime.offset);
      expect(result).toStrictEqual({ eventId: '1', didStart: false });
      expect(getState().runtime.offset).toBe(1000);

      vi.setSystemTime('jan 1 00:00:01');
      result = roll(rundown, getState().runtime.offset);
      expect(result).toStrictEqual({ eventId: '2', didStart: true });
      expect(getState().runtime.offset).toBe(1000);

      vi.setSystemTime('jan 1 00:00:02');
      result = roll(rundown, getState().runtime.offset);
      expect(result).toStrictEqual({ eventId: '3', didStart: true });
      expect(getState().runtime.offset).toBe(1000);
    });

    test.todo('with gaps', () => {
      //this is a bit involved as it also depends somewhat on the RintimeService
    });
  });
});
