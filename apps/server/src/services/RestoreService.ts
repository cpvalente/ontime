import { Playback } from 'ontime-types';

import { JSONFile } from 'lowdb/node';

import { resolveRestoreFile } from '../setup.js';

export type RestorePoint = {
  playback: Playback;
  selectedEventId: string | null;
  startedAt: number | null;
  addedTime: number | null;
  pausedAt: number | null;
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

  if (typeof restorePoint.addedTime !== 'number' && restorePoint.addedTime !== null) {
    return false;
  }

  if (typeof restorePoint.pausedAt !== 'number' && restorePoint.pausedAt !== null) {
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
  private readonly filePath: string | null;
  private readonly file: JSONFile<RestorePoint | null>;
  private lastStore: string | null;
  private failedCreateAttempts: number;

  constructor(filePath: string) {
    this.filePath = filePath;

    this.lastStore = null;
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

    const stringifiedStore = JSON.stringify(newState);
    if (stringifiedStore !== this.lastStore) {
      try {
        await this.write(newState);
        this.lastStore = stringifiedStore;
        this.failedCreateAttempts = 0;
      } catch (_error) {
        this.failedCreateAttempts += 1;
      }
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
      await this.write(null);
    } catch (_error) {
      // nothing to do
    }
  }
}

export const restoreService = new RestoreService(resolveRestoreFile);
