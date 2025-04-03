import { TimerPhase, Playback, OffsetMode } from 'ontime-types';
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
    relativeOffset: 0,
    plannedStart: 0,
    plannedEnd: 0,
    actualStart: null,
    expectedEnd: null,
    offsetMode: OffsetMode.Absolute,
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
  },
  _timer: {
    forceFinish: null,
    pausedAt: null,
    secondaryTarget: null,
  },
  _rundown: {
    totalDelay: 0,
  },
};

export function makeRuntimeStateData(patch?: Partial<RuntimeState>): RuntimeState {
  return deepmerge(baseState, patch) as RuntimeState;
}
