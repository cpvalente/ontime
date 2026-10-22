import { deepEqual } from 'fast-equals';
import { JSONFile } from 'lowdb/node';
import { LogOrigin } from 'ontime-types';
import { MILLIS_PER_HOUR, getErrorMessage } from 'ontime-utils';

import * as logger from '../../api-data/logs/logs.service.js';
import { getDataProvider } from '../../classes/data-provider/DataProvider.js';
import * as timeCore from '../../lib/time-core/timeCore.js';
import { publicFiles } from '../../setup/index.js';
import { isRestorePoint } from './restore.parser.js';
import type { RestorePoint } from './restore.types.js';

/** what the runtime saves, the service adds the project and the instant */
type RestorePointData = Omit<RestorePoint, 'projectId' | 'savedAt'>;

/** a point older than this belongs to a show which is no longer running */
const maxRestoreAge = 5 * MILLIS_PER_HOUR;

let failedCreateAttempts = 0;
let savedState: Omit<RestorePoint, 'savedAt'> | null = null;
let fileRef: JSONFile<RestorePoint | null> | null = null;

/**
 * Service manages saving snapshot of application state
 * that can then be restored when reopening
 */
export const restoreService = {
  save,
  load,
  forProject,
  clear,
};

/**
 * Saves a restore point
 * @param [writeFn=write] - allows overriding the write function for testing
 * @public
 */
async function save(data: RestorePointData, writeFn = write) {
  // after three failed attempts, mark the service as unavailable
  if (failedCreateAttempts > 3) {
    return;
  }

  const point = { ...data, projectId: getDataProvider().getProjectId() };
  if (deepEqual(point, savedState)) {
    return;
  }

  try {
    await writeFn({ ...point, savedAt: timeCore.now() });
    savedState = point;
    failedCreateAttempts = 0;
  } catch (error) {
    failedCreateAttempts += 1;
    if (failedCreateAttempts > 3) {
      logger.warning(LogOrigin.Server, 'Restore saving stopped', { error: getErrorMessage(error) });
    }
  }
}

/**
 * Attempts reading a restore point from a given file path
 * Returns null if none found or it is too old to resume, restore point otherwise
 * @param [readFn=read] - allows overriding the read function for testing
 * @public
 */
async function load(readFn = read): Promise<RestorePoint | null> {
  try {
    const maybeRestorePoint = await readFn();
    if (maybeRestorePoint === null) {
      return null;
    }

    if (!isRestorePoint(maybeRestorePoint)) {
      logger.warning(LogOrigin.Server, 'Restore skipped', { reason: 'invalid-file' });
      return null;
    }

    if (timeCore.timeSince(timeCore.now(), maybeRestorePoint.savedAt) > maxRestoreAge) {
      logger.info(LogOrigin.Server, 'Restore skipped', { reason: 'stale', savedAt: maybeRestorePoint.savedAt });
      return null;
    }

    return maybeRestorePoint;
  } catch (error) {
    logger.warning(LogOrigin.Server, 'Restore skipped', { reason: 'read-failed', error: getErrorMessage(error) });
    return null;
  }
}

/**
 * Keeps a restore point only for the project it was saved in
 * @public
 */
function forProject(restorePoint: RestorePoint | null, projectId: string): RestorePoint | null {
  if (restorePoint === null || restorePoint.projectId === projectId) {
    return restorePoint;
  }

  logger.warning(LogOrigin.Server, 'Restore skipped', { reason: 'other-project', projectId: restorePoint.projectId });
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
