import { deepEqual } from 'fast-equals';
import { JSONFile } from 'lowdb/node';
import { LogOrigin } from 'ontime-types';
import { MILLIS_PER_HOUR, getErrorMessage } from 'ontime-utils';

import * as logger from '../../api-data/logs/logs.service.js';
import { getDataProvider } from '../../classes/data-provider/DataProvider.js';
import * as timeCore from '../../lib/time-core/timeCore.js';
import { publicFiles } from '../../setup/index.js';
import type { AuxTimers } from '../aux-timer-service/auxTimer.utils.js';
import { parseRestorePoint } from './restore.parser.js';
import type { RestorePoint, RuntimeRestore } from './restore.types.js';

/** a point older than this belongs to a show which is no longer running */
const maxRestoreAge = 5 * MILLIS_PER_HOUR;

let failedCreateAttempts = 0;
let runtime: RestorePoint['runtime'];
let auxTimers: AuxTimers | undefined;
let savedState: Omit<RestorePoint, 'savedAt'> | null = null;
let fileRef: JSONFile<RestorePoint | null> | null = null;

/**
 * Service manages saving snapshot of application state
 * that can then be restored when reopening
 */
export const restoreService = {
  save,
  saveAuxTimers,
  load,
  forProject,
  clear,
};

/**
 * Saves the runtime part of the restore point
 * @param [writeFn=write] - allows overriding the write function for testing
 * @public
 */
async function save(data: RuntimeRestore, writeFn = write) {
  runtime = { ...data, projectId: getDataProvider().getProjectId() };
  await persist(writeFn);
}

/**
 * Saves the aux timers part of the restore point
 * @param [writeFn=write] - allows overriding the write function for testing
 * @public
 */
async function saveAuxTimers(timers: AuxTimers, writeFn = write) {
  auxTimers = timers;
  await persist(writeFn);
}

/**
 * Writes both parts into the restore point
 */
async function persist(writeFn: typeof write) {
  // after three failed attempts, mark the service as unavailable
  if (failedCreateAttempts > 3 || (runtime === undefined && auxTimers === undefined)) {
    return;
  }

  const point = { runtime, auxTimers };
  if (deepEqual(point, savedState)) {
    return;
  }

  // compared with the last requested write, so a change back while a write is pending is saved too
  savedState = point;
  try {
    await writeFn({ ...point, savedAt: timeCore.now() });
    failedCreateAttempts = 0;
  } catch (error) {
    savedState = null;
    failedCreateAttempts += 1;
    if (failedCreateAttempts > 3) {
      logger.warning(LogOrigin.Server, 'Restore saving stopped', { error: getErrorMessage(error) });
    }
  }
}

/**
 * Attempts reading the restore point
 * Returns null if none found or it is too old to resume, the restore point otherwise
 * @param [readFn=read] - allows overriding the read function for testing
 * @public
 */
async function load(readFn: () => Promise<unknown> = read): Promise<RestorePoint | null> {
  try {
    const file = await readFn();
    if (file === null) {
      return null;
    }

    const restorePoint = parseRestorePoint(file);
    if (restorePoint === null) {
      logger.warning(LogOrigin.Server, 'Restore skipped', { reason: 'invalid-file' });
      return null;
    }

    if (timeCore.timeSince(timeCore.now(), restorePoint.savedAt) > maxRestoreAge) {
      logger.info(LogOrigin.Server, 'Restore skipped', { reason: 'stale', savedAt: restorePoint.savedAt });
      return null;
    }

    return restorePoint;
  } catch (error) {
    logger.warning(LogOrigin.Server, 'Restore skipped', { reason: 'read-failed', error: getErrorMessage(error) });
    return null;
  }
}

/**
 * Keeps playback only in the project it was saved in, aux timers resume in any project
 * @public
 */
function forProject(restorePoint: RestorePoint | null, projectId: string): RestorePoint | null {
  if (!restorePoint?.runtime || restorePoint.runtime.projectId === projectId) {
    return restorePoint;
  }

  logger.warning(LogOrigin.Server, 'Restore skipped', {
    reason: 'other-project',
    projectId: restorePoint.runtime.projectId,
  });
  return { ...restorePoint, runtime: undefined };
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
