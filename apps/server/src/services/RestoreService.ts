import { Playback } from 'ontime-types';

import { readFileSync } from 'fs';
import { Writer } from 'steno';

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

  private lastStore: string | null;
  private file: Writer | null;
  private failedCreateAttempts: number;

  constructor(filePath: string) {
    this.filePath = filePath;

    this.lastStore = null;
    this.file = null;
    this.failedCreateAttempts = 0;
  }

  /**
   * Utility, creates a restore file
   */
  create() {
    this.file = new Writer(this.filePath);
  }

  /**
   * Utility, reads from file
   * @private
   */
  private read() {
    return readFileSync(this.filePath, 'utf-8');
  }

  /**
   * Utility writes payload to file
   * @throws
   * @param stringifiedState
   */
  private async write(stringifiedState: string) {
    // Create a file if it doesnt exist
    if (!this.file) {
      this.create();
    }
    // steno is async, and it uses a queue to avoid unnecessary re-writes
    await this.file.write(stringifiedState);
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
        await this.write(stringifiedStore);
        this.lastStore = stringifiedStore;
        this.failedCreateAttempts = 0;
      } catch (_err) {
        this.failedCreateAttempts += 1;
      }
    }
  }

  /**
   * Attempts reading a restore point from a given file path
   * Returns null if none found, restore point otherwise
   */
  load(): RestorePoint | null {
    try {
      const data = this.read();
      const maybeRestorePoint = JSON.parse(data);

      if (!isRestorePoint(maybeRestorePoint)) {
        return null;
      }

      return maybeRestorePoint;
    } catch (_error) {
      // no need to notify the user
      return null;
    }
  }

  /**
   * Clears the restore file
   */
  async clear() {
    if (this.file && this.failedCreateAttempts <= 3) {
      try {
        await this.file.write('');
      } catch (_error) {
        // nothing to do
      }
    }
    this.file = undefined;
  }
}

export const restoreService = new RestoreService(resolveRestoreFile);
