import { TimerPhase, Playback } from 'ontime-types';
import { deepmerge } from 'ontime-utils';
import type { RuntimeState } from '../runtimeState.js';

const baseState: RuntimeState = {
  clock: 0,
  currentBlock: {
    block: null,
    startedAt: null,
  },
  eventNow: null,
  publicEventNow: null,
  eventNext: null,
  publicEventNext: null,
  runtime: {
    selectedEventIndex: null,
    numEvents: 0,
    offset: 0,
    plannedStart: 0,
    plannedEnd: 0,
    actualStart: null,
    expectedEnd: null,
  },
  timer: {
    addedTime: 0,
    current: null,
    duration: null,
    elapsed: null,
    expectedFinish: null,
    finishedAt: null,
    phase: TimerPhase.None,
    playback: Playback.Stop,
    secondaryTimer: null,
    startedAt: null,
    speed: 1,
  },
  _timer: {
    forceFinish: null,
    totalDelay: 0,
    pausedAt: null,
    secondaryTarget: null,
  },
};

export function makeRuntimeStateData(patch?: Partial<RuntimeState>): RuntimeState {
  return deepmerge(baseState, patch) as RuntimeState;
}
