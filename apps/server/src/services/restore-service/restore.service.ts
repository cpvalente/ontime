import { JSONFile } from 'lowdb/node';
import { deepEqual } from 'fast-equals';

import { publicFiles } from '../../setup/index.js';

import { isRestorePoint } from './restore.parser.js';
import type { RestorePoint } from './restore.type.js';
import { Maybe } from 'ontime-types';

/**
 * Service manages saving snapshot of application state
 * that can then be restored when reopening
 */
export class RestoreService {
  private fileRef: JSONFile<Maybe<RestorePoint>>;
  private failedCreateAttempts = 0;
  private savedState: RestorePoint | null = null;

  constructor() {
    this.fileRef = new JSONFile<Maybe<RestorePoint>>(publicFiles.restoreFile);
  }

  /**
   * Saves a restore point
   * @param [data] - the restore point to save
   * @param [writeFn=write] - allows overriding the write function for testing
   */
  public async save(data: RestorePoint, writeFn = this.write) {
    // after three failed attempts, mark the service as unavailable
    if (this.failedCreateAttempts > 3) {
      return;
    }

    if (deepEqual(data, this.savedState)) {
      return;
    }

    try {
      await writeFn(data);
      this.savedState = { ...data };
      this.failedCreateAttempts = 0;
    } catch (_error) {
      this.failedCreateAttempts += 1;
    }
  }

  /**
   * Attempts reading a restore point from a given file path
   * Returns null if none found, restore point otherwise
   * @param [readFn=read] - allows overriding the read function for testing
   */
  public async load(readFn = this.read): Promise<RestorePoint | null> {
    try {
      const maybeRestorePoint = await readFn();
      if (isRestorePoint(maybeRestorePoint)) {
        return maybeRestorePoint;
      }
    } catch (_error) {
      // no need to notify the user
    }
    return null;
  }

  /**
   * Saves a restore point
   * @param [data] - the restore point to save
   * @param [writeFn=write] - allows overriding the write function for testing
   */
  public async clear(writeFn = this.write) {
    // after three failed attempts, mark the service as unavailable
    if (this.failedCreateAttempts > 3) {
      return;
    }

    this.savedState = null;

    try {
      await writeFn(null);
      this.failedCreateAttempts = 0;
    } catch (_error) {
      this.failedCreateAttempts += 1;
    }
  }

  /**
   * Reads from an initialized file reference
   * @private
   */
  private async read(): Promise<RestorePoint | null> {
    return this.fileRef.read();
  }

  /**
   * Writes to an initialized file reference
   * @throws - if writing fails
   */
  private async write(data: Maybe<RestorePoint>) {
    return this.fileRef.write(data);
  }
}
