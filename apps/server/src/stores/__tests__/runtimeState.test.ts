import { OntimeEvent, Playback } from 'ontime-types';
import { deepmerge } from 'ontime-utils';

import { RuntimeState, clear, getState, load, pause, start, stop } from '../runtimeState.js';

const mockEvent = {
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
    lastUpdate: null,
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

    vi.mock('../../services/rundown-service/RundownService.js', () => ({
      getPlayableEvents: vi.fn().mockReturnValue([
        {
          id: 'mock',
          cue: 'mock',
          timeStart: 0,
          timeEnd: 1000,
          duration: 1000,
        },
      ]),
    }));
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

      // 4. Stop event
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
    });

    test.todo('roll mode', () => {});
  });
});
