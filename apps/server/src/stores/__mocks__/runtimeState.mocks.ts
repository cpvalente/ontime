import { type Duration, type Instant, OffsetMode, Playback, type TimeOfDay, TimerPhase } from 'ontime-types';
import { deepmerge } from 'ontime-utils';

import type { RuntimeState } from '../runtimeState.js';

const baseState: RuntimeState = {
  clock: 0 as TimeOfDay,
  _now: 0 as Instant,
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
    actualGroupStart: null,
    currentDay: 0,
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
    startedAt: null,
    pausedAt: null,
    pausedDuration: 0 as Duration,
    secondaryTarget: null,
    hasFinished: false,
  },
  _rundown: {
    totalDelay: 0,
  },
  _group: null,
  _end: null,
  _flag: null,
  _startDayOffset: null,
  _startEpoch: null,
  _startEventStart: null,
  _startEventDay: null,
  _groupStartedAt: null,
};

export function makeRuntimeStateData(patch?: Partial<RuntimeState> | Record<string, unknown>): RuntimeState {
  return deepmerge(baseState, (patch ?? {}) as Partial<RuntimeState>) as RuntimeState;
}
