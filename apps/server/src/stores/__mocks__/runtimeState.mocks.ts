import { TimerPhase, Playback, OffsetMode } from 'ontime-types';
import { deepmerge } from 'ontime-utils';
import type { RuntimeState } from '../runtimeState.js';

const baseState: RuntimeState = {
  clock: 0,
  eventNow: null,
  eventNext: null,
  eventFlag: null,
  groupNow: null,
  rundown: {
    selectedEventIndex: null,
    numEvents: 0,
    plannedStart: 0,
    plannedEnd: 0,
    actualStart: null,
  },
  offset: {
    absolute: 0,
    relative: 0,
    mode: OffsetMode.Absolute,
    expectedRundownEnd: null,
    expectedGroupEnd: null,
    expectedFlagStart: null,
  },
  timer: {
    addedTime: 0,
    current: null,
    duration: null,
    elapsed: null,
    expectedFinish: null,
    phase: TimerPhase.None,
    playback: Playback.Stop,
    secondaryTimer: null,
    startedAt: null,
  },
  _timer: {
    forceFinish: null,
    pausedAt: null,
    secondaryTarget: null,
    hasFinished: false,
  },
  _rundown: {
    totalDelay: 0,
  },
  _group: null,
  _end: null,
  _flag: null,
};

export function makeRuntimeStateData(patch?: Partial<RuntimeState>): RuntimeState {
  return deepmerge(baseState, patch) as RuntimeState;
}
