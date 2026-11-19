import {
  Day,
  Duration,
  Instant,
  Maybe,
  OffsetMode,
  Playback,
  SimpleDirection,
  SimplePlayback,
  TimeOfDay,
} from 'ontime-types';

import * as timeCore from '../../lib/time-core/timeCore.js';
import { is } from '../../utils/is.js';
import type { AuxTimer, AuxTimers } from '../aux-timer-service/auxTimer.utils.js';
import type { RestorePoint } from './restore.types.js';

/**
 * Reads a restore point
 * @returns null if it is not a valid restore point
 */
export function parseRestorePoint(value: unknown): RestorePoint | null {
  if (!is.object(value) || !is.objectWithKeys(value, ['savedAt']) || !is.number(value.savedAt)) {
    return null;
  }
  const savedAt = value.savedAt as Instant;

  let runtime: RestorePoint['runtime'];
  if ('runtime' in value && value.runtime !== undefined) {
    const parsed = parseSavedRuntime(value.runtime, savedAt);
    if (parsed === null) {
      return null;
    }
    runtime = parsed;
  }

  const auxTimers = 'auxTimers' in value ? value.auxTimers : undefined;
  if (auxTimers !== undefined && !isAuxTimers(auxTimers)) {
    return null;
  }

  return { runtime, auxTimers, savedAt };
}

type SavedRuntime = NonNullable<RestorePoint['runtime']>;

const isMaybeNumber = (value: unknown): value is number | null => value === null || is.number(value);

/**
 * Reads the runtime part of a restore point
 * Older restore points saved times of day, they are read as the latest instants before the point was saved
 */
function parseSavedRuntime(point: unknown, savedAt: Instant): SavedRuntime | null {
  if (
    !is.object(point) ||
    !is.objectWithKeys(point, [
      'projectId',
      'rundownId',
      'playback',
      'selectedEventId',
      'startedAt',
      'addedTime',
      'pausedAt',
      'startEpoch',
      'offsetMode',
    ])
  ) {
    return null;
  }

  if (!is.string(point.projectId) || !is.string(point.rundownId)) {
    return null;
  }

  if (!Object.values(Playback).includes(point.playback as Playback)) {
    return null;
  }

  if (!is.string(point.selectedEventId) && point.selectedEventId !== null) {
    return null;
  }

  if (!Object.values(OffsetMode).includes(point.offsetMode as OffsetMode)) {
    return null;
  }

  const { startedAt, addedTime, pausedAt, startEpoch } = point;
  if (!isMaybeNumber(startedAt) || !is.number(addedTime) || !isMaybeNumber(pausedAt) || !isMaybeNumber(startEpoch)) {
    return null;
  }

  // missing keys are read as null, older restore points do not have them
  const optional = (key: string): unknown => (key in point ? (point as Record<string, unknown>)[key] : null);
  const startDayOffset = optional('startDayOffset');
  const startEventStart = optional('startEventStart');
  const startEventDay = optional('startEventDay');
  const groupStartedAt = optional('groupStartedAt');
  const pausedDuration = 'pausedDuration' in point ? point.pausedDuration : 0;
  if (
    !isMaybeNumber(startDayOffset) ||
    !isMaybeNumber(startEventStart) ||
    !isMaybeNumber(startEventDay) ||
    !isMaybeNumber(groupStartedAt) ||
    !is.number(pausedDuration)
  ) {
    return null;
  }

  // older restore points carry a first start and keep the timer's times of day
  const isTimeOfDay = 'firstStart' in point;
  const toInstant = (value: number | null) =>
    value === null || !isTimeOfDay ? (value as Maybe<Instant>) : timeCore.lastInstantAt(value as TimeOfDay, savedAt);

  return {
    projectId: point.projectId,
    rundownId: point.rundownId,
    playback: point.playback as Playback,
    selectedEventId: point.selectedEventId,
    startedAt: toInstant(startedAt),
    pausedAt: toInstant(pausedAt),
    pausedDuration: pausedDuration as Duration,
    addedTime: addedTime as Duration,
    startEpoch: startEpoch as Maybe<Instant>,
    startDayOffset: startDayOffset as Maybe<Day>,
    startEventStart: startEventStart as Maybe<TimeOfDay>,
    startEventDay: startEventDay as Maybe<Day>,
    groupStartedAt: groupStartedAt as Maybe<Instant>,
    offsetMode: point.offsetMode as OffsetMode,
  };
}

function isAuxTimers(timers: unknown): timers is AuxTimers {
  return is.array(timers) && timers.length === 3 && timers.every(isAuxTimer);
}

function isAuxTimer(timer: unknown): timer is AuxTimer {
  if (!is.object(timer) || !is.objectWithKeys(timer, ['playback', 'direction', 'duration', 'value', 'startedAt'])) {
    return false;
  }

  if (!Object.values(SimplePlayback).includes(timer.playback as SimplePlayback)) {
    return false;
  }

  if (!Object.values(SimpleDirection).includes(timer.direction as SimpleDirection)) {
    return false;
  }

  if (!is.number(timer.duration) || !is.number(timer.value)) {
    return false;
  }

  // only a running timer counts from the instant it started
  const isRunning = timer.playback === SimplePlayback.Start;
  return isRunning ? is.number(timer.startedAt) : timer.startedAt === null;
}
