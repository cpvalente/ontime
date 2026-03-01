import { deepEqual } from 'fast-equals';
import { JSONFile } from 'lowdb/node';

import { publicFiles } from '../../setup/index.js';
import { isRestorePoint } from './restore.parser.js';
import type { RestorePoint } from './restore.type.js';

let failedCreateAttempts = 0;
let savedState: RestorePoint | null = null;
let fileRef: JSONFile<RestorePoint | null> | null = null;

/**
 * Service manages saving snapshot of application state
 * that can then be restored when reopening
 */
export const restoreService = {
  save,
  load,
  clear,
};

/**
 * Saves a restore point
 * @param [writeFn=write] - allows overriding the write function for testing
 * @public
 */
async function save(data: RestorePoint, writeFn = write) {
  // after three failed attempts, mark the service as unavailable
  if (failedCreateAttempts > 3) {
    return;
  }

  if (deepEqual(data, savedState)) {
    return;
  }

  try {
    await writeFn(data);
    savedState = { ...data };
    failedCreateAttempts = 0;
  } catch (_error) {
    failedCreateAttempts += 1;
  }
}

/**
 * Attempts reading a restore point from a given file path
 * Returns null if none found, restore point otherwise
 * @param [readFn=read] - allows overriding the read function for testing
 * @public
 */
async function load(readFn = read): Promise<RestorePoint | null> {
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
 * Clears the restore file
 * @param [writeFn=write] - allows overriding the write function for testing
 * @public
 */
async function clear(writeFn = write) {
  try {
    await writeFn(null);
  } catch (_error) {
    // nothing to do
  }
}

/**
 * Initialised file reference
 * @private
 */
async function init(): Promise<JSONFile<RestorePoint | null>> {
  if (fileRef) return fileRef;

  fileRef = new JSONFile<RestorePoint | null>(publicFiles.restoreFile);
  return fileRef;
}

/**
 * Reads from an intialized file reference
 * @private
 */
async function read(): Promise<RestorePoint | null> {
  const file = await init();
  return file.read();
}

/**
 * Writes to an intialized file reference
 * @throws - if writing fails
 * @private
 */
async function write(data: RestorePoint | null) {
  const file = await init();
  return file.write(data);
}
