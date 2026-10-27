import { Instant, OffsetMode, Playback, SimpleDirection, SimplePlayback } from 'ontime-types';

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

  const runtime = 'runtime' in value ? value.runtime : undefined;
  if (runtime !== undefined && !isSavedRuntime(runtime)) {
    return null;
  }

  const auxTimers = 'auxTimers' in value ? value.auxTimers : undefined;
  if (auxTimers !== undefined && !isAuxTimers(auxTimers)) {
    return null;
  }

  return { runtime, auxTimers, savedAt: value.savedAt as Instant };
}

function isSavedRuntime(point: unknown): point is RestorePoint['runtime'] {
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
      'firstStart',
      'startEpoch',
      'currentDay',
      'offsetMode',
    ])
  ) {
    return false;
  }

  if (!is.string(point.projectId) || !is.string(point.rundownId)) {
    return false;
  }

  if (!Object.values(Playback).includes(point.playback as Playback)) {
    return false;
  }

  if (!is.string(point.selectedEventId) && point.selectedEventId !== null) {
    return false;
  }

  if (!is.number(point.startedAt) && point.startedAt !== null) {
    return false;
  }

  if (!is.number(point.addedTime)) {
    return false;
  }

  if (!is.number(point.pausedAt) && point.pausedAt !== null) {
    return false;
  }

  if ('pausedDuration' in point && !is.number(point.pausedDuration)) {
    return false;
  }

  if (!is.number(point.firstStart) && point.firstStart !== null) {
    return false;
  }

  if (!is.number(point.startEpoch) && point.startEpoch !== null) {
    return false;
  }

  if (!is.number(point.currentDay) && point.currentDay !== null) {
    return false;
  }

  if (!Object.values(OffsetMode).includes(point.offsetMode as OffsetMode)) {
    return false;
  }

  return true;
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
