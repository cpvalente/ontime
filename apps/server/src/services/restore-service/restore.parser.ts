import { Playback } from 'ontime-types';
import { dayInMs } from 'ontime-utils';

import { is } from '../../utils/is.js';
import type { RestorePoint } from './restore.type.js';

/**
 * Utility validates a RestorePoint
 */
export function isRestorePoint(restorePoint: unknown): restorePoint is RestorePoint {
  if (!is.object(restorePoint)) {
    return false;
  }

  if (
    !is.objectWithKeys(restorePoint, [
      'playback',
      'selectedEventId',
      'startedAt',
      'addedTime',
      'pausedAt',
      'firstStart',
      'startEpoch',
      'currentDay',
    ])
  ) {
    return false;
  }

  if (!is.string(restorePoint.playback) && !Object.values(Playback).includes(restorePoint.playback as Playback)) {
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

  // pausedAt is an instant, restore points made before this change contained a time of day
  // we reject those to avoid resuming with a corrupt pause duration
  if (restorePoint.pausedAt !== null && (!is.number(restorePoint.pausedAt) || restorePoint.pausedAt < dayInMs)) {
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

  return true;
}
