import { Playback } from 'ontime-types';

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

  if (!is.number(restorePoint.pausedAt) && restorePoint.pausedAt !== null) {
    return false;
  }

  if (!is.number(restorePoint.firstStart) && restorePoint.firstStart !== null) {
    return false;
  }

  if (!is.number(restorePoint.startEpoch) && restorePoint.startEpoch !== null) {
    return false;
  }

  return true;
}
