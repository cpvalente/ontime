import { OffsetMode, Playback } from 'ontime-types';

import { is } from '../../utils/is.js';
import type { RestorePoint } from './restore.types.js';

/**
 * Utility validates a RestorePoint
 */
export function isRestorePoint(restorePoint: unknown): restorePoint is RestorePoint {
  if (!is.object(restorePoint)) {
    return false;
  }

  if (
    !is.objectWithKeys(restorePoint, [
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
      'savedAt',
    ])
  ) {
    return false;
  }

  if (!is.string(restorePoint.rundownId)) {
    return false;
  }

  if (!Object.values(Playback).includes(restorePoint.playback as Playback)) {
    return false;
  }

  if (!is.string(restorePoint.selectedEventId) && restorePoint.selectedEventId !== null) {
    return false;
  }

  if (!is.number(restorePoint.startedAt) && restorePoint.startedAt !== null) {
    return false;
  }

  if (!is.number(restorePoint.addedTime)) {
    return false;
  }

  if (!is.number(restorePoint.pausedAt) && restorePoint.pausedAt !== null) {
    return false;
  }

  if ('pausedDuration' in restorePoint && !is.number(restorePoint.pausedDuration)) {
    return false;
  }

  if (!is.number(restorePoint.firstStart) && restorePoint.firstStart !== null) {
    return false;
  }

  if (!is.number(restorePoint.startEpoch) && restorePoint.startEpoch !== null) {
    return false;
  }

  if (!is.number(restorePoint.currentDay) && restorePoint.currentDay !== null) {
    return false;
  }

  if (!Object.values(OffsetMode).includes(restorePoint.offsetMode as OffsetMode)) {
    return false;
  }

  if (!is.number(restorePoint.savedAt)) {
    return false;
  }

  return true;
}
