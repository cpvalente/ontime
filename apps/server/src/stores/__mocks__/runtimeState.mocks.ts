import { Day, type Duration, type Instant, OffsetMode, Playback, TimeOfDay, TimerPhase } from 'ontime-types';
import { deepmerge } from 'ontime-utils';

import { ZERO_DURATION } from '../../lib/time-core/timeCore.js';
import type { InternalRuntimeState, RuntimeState } from '../runtimeState.js';

export const runtimePlaceholder = {
  timer: {
    addedTime: ZERO_DURATION,
    current: null,
    duration: null,
    elapsed: null,
    expectedFinish: null,
    phase: TimerPhase.None,
    playback: Playback.Stop,
    secondaryTimer: null,
    startedAt: null,
  },
  offset: {
    absolute: ZERO_DURATION,
    relative: ZERO_DURATION,
    mode: OffsetMode.Absolute,
    expectedGroupEnd: null,
    expectedRundownEnd: null,
    expectedFlagStart: null,
  },
  rundown: {
    selectedEventIndex: null,
    numEvents: 0,
    plannedStart: 0 as TimeOfDay,
    plannedEnd: 0 as TimeOfDay,
    actualStart: null,
    actualGroupStart: null,

    currentDay: 0 as Day,
  },
} as Readonly<InternalRuntimeState>;

const baseState: InternalRuntimeState = {
  _now: 0 as Instant,
  eventNow: null,
  eventNext: null,
  eventFlag: null,
  groupNow: null,
  rundown: {
    ...runtimePlaceholder.rundown,
  },
  offset: {
    ...runtimePlaceholder.offset,
  },
  timer: { ...runtimePlaceholder.timer },
  _timer: {
    forceFinish: false,
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
};

export function makeRuntimeStateData(patch?: Partial<RuntimeState> | Record<string, unknown>): RuntimeState {
  return deepmerge(baseState, (patch ?? {}) as Partial<RuntimeState>) as RuntimeState;
}
