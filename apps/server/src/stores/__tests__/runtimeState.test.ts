import { OntimeEvent, Playback } from 'ontime-types';
import { deepmerge } from 'ontime-utils';

import { RuntimeState, addTime, clear, getState, load, pause, start, stop } from '../runtimeState.js';
import { initRundown } from '../../services/rundown-service/RundownService.js';

const mockEvent = {
  type: 'event',
  id: 'mock',
  cue: 'mock',
  timeStart: 0,
  timeEnd: 1000,
  duration: 1000,
} as OntimeEvent;

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
    secondaryTarget: null,
  },
} as RuntimeState;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const makeMockState = (patch: RuntimeState): RuntimeState => {
  return deepmerge(mockState, patch);
};

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

  describe('playback operations', () => {
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
    initRundown([event1, event2], {});
    test('runtime offset', () => {
      // 1. Load event
      load(event1, [event1, event2]);
      let newState = getState();
      expect(newState.runtime.actualStart).toBeNull();
      expect(newState.runtime.plannedStart).toBe(0);
      expect(newState.runtime.plannedEnd).toBe(1500);

      // 2. Start event
      start();
      newState = getState();
      const firstStart = newState.clock;
      expect(newState.runtime.actualStart).toBe(newState.clock);
      expect(newState.runtime.offset).toBe(event1.timeStart - newState.clock);
      expect(newState.runtime.expectedEnd).toBe(event2.timeEnd - newState.runtime.offset);

      // 3. Next event
      load(event2, [event1, event2]);
      start();
      newState = getState();
      expect(newState.runtime.actualStart).toBeCloseTo(firstStart, 0);
      // we are over-under, the difference between the schedule and the actual start
      const delayBefore = event2.timeStart - newState.clock;
      expect(newState.runtime.offset).toBe(delayBefore);
      // finish is the difference between the runtime and the schedule
      expect(newState.runtime.expectedEnd).toBe(event2.timeEnd - newState.runtime.offset);

      // 4. Add time
      addTime(10);
      newState = getState();
      expect(newState.runtime.offset).toBe(delayBefore - 10);
      expect(newState.runtime.expectedEnd).toBe(event2.timeEnd - newState.runtime.offset);

      // 5. Stop event
      stop();
      newState = getState();
      expect(newState.runtime.actualStart).toBeNull();
      expect(newState.runtime.offset).toBeNull();
      expect(newState.runtime.expectedEnd).toBeNull();
    });

    test.todo('runtime offset on timers in overtime', () => {});

    test.todo('roll mode', () => {});
  });
});
