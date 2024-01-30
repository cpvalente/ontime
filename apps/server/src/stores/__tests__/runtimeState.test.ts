import { OntimeEvent, Playback } from 'ontime-types';
import { RuntimeState, clear, getState, load, start } from '../runtimeState.js';
import { deepmerge } from 'ontime-utils';

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

const makeMockState = (patch: RuntimeState): RuntimeState => {
  return deepmerge(mockState, patch);
};

describe('mutation on runtimeState', () => {
  beforeEach(() => {
    clear(0);
  });

  describe('playback operations', () => {
    it('refuses if nothing is loaded', () => {
      const success = start(mockState);
      expect(success).toBe(false);
    });
    it('loads and plays a given event', () => {
      load(mockEvent, [mockEvent]);
      const newState = getState();
      expect(newState.eventNow.id).toBe(mockEvent.id);
      expect(newState.timer.playback).toBe(Playback.Armed);

      const success = start();
      expect(success).toBe(true);
      expect(newState.clock).not.toBe(666);
      expect(newState.timer).toMatchObject({
        playback: Playback.Play,
      });
    });
  });
});
