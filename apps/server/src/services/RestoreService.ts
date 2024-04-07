import { MaybeNumber, MaybeString, Playback } from 'ontime-types';

import { JSONFile } from 'lowdb/node';
import { resolveRestoreFile } from '../setup/index.js';
import { deepEqual } from 'fast-equals';

export type RestorePoint = {
  playback: Playback;
  selectedEventId: MaybeString;
  startedAt: MaybeNumber;
  addedTime: number;
  pausedAt: MaybeNumber;
  firstStart: MaybeNumber;
};

/**
 * Utility validates a RestorePoint
 * @param obj
 * @return boolean
 */
export function isRestorePoint(obj: unknown): obj is RestorePoint {
  if (!obj) {
    return false;
  }

  const restorePoint = obj as RestorePoint;

  if (typeof restorePoint.playback !== 'string' || !Object.values(Playback).includes(restorePoint.playback)) {
    return false;
  }

  if (typeof restorePoint.selectedEventId !== 'string' && restorePoint.selectedEventId !== null) {
    return false;
  }

  if (typeof restorePoint.startedAt !== 'number' && restorePoint.startedAt !== null) {
    return false;
  }

  if (typeof restorePoint.addedTime !== 'number') {
    return false;
  }

  if (typeof restorePoint.pausedAt !== 'number' && restorePoint.pausedAt !== null) {
    return false;
  }

  if (typeof restorePoint.firstStart !== 'number' && restorePoint.pausedAt !== null) {
    return false;
  }

  return true;
}

/**
 * Utility interface to allow dependency injection during test
 */

/**
 * Service manages saving of application state
 * that can then be restored when reopening
 */
export class RestoreService {
  private readonly filePath: MaybeString;
  private readonly file: JSONFile<RestorePoint | null>;
  private failedCreateAttempts: number;
  private savedState: RestorePoint | null;

  constructor(filePath: string) {
    this.filePath = filePath;

    this.savedState = null;
    this.file = new JSONFile(this.filePath);
    this.failedCreateAttempts = 0;
  }

  /**
   * Utility, reads from file
   * @private
   */
  private async read() {
    return this.file.read();
  }

  /**
   * Utility writes payload to file
   * @throws
   * @param stringifiedState
   */
  private async write(data: RestorePoint) {
    await this.file.write(data);
  }

  /**
   * Saves runtime data to restore file
   * @param newState RestorePoint
   */
  async save(newState: RestorePoint) {
    // after three failed attempts, mark the service as unavailable
    if (this.failedCreateAttempts > 3) {
      return;
    }

    if (deepEqual(newState, this.savedState)) {
      return;
    }

    try {
      await this.write(newState);
      this.savedState = { ...newState };
      this.failedCreateAttempts = 0;
    } catch (_error) {
      this.failedCreateAttempts += 1;
    }
  }

  /**
   * Attempts reading a restore point from a given file path
   * Returns null if none found, restore point otherwise
   */
  async load(): Promise<RestorePoint | null> {
    try {
      const maybeRestorePoint = await this.read();
      if (isRestorePoint(maybeRestorePoint)) {
        return maybeRestorePoint;
      }
    } catch (_error) {
      // no need to notify the user
    }
    return null;
  }

  /**
   * Clears the restore file
   */
  async clear() {
    try {
      await this.file.write(null);
    } catch (_error) {
      // nothing to do
    }
  }
}

export const restoreService = new RestoreService(resolveRestoreFile);
