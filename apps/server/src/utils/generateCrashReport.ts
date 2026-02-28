import { writeFileSync } from 'fs';
import { join } from 'path';

import { getCurrentRundown } from '../api-data/rundown/rundown.dao.js';
import { logger } from '../classes/Logger.js';
import { ONTIME_VERSION } from '../ONTIME_VERSION.js';
import { publicDir } from '../setup/index.js';
import { getState } from '../stores/runtimeState.js';
import { ensureDirectory } from './fileManagement.js';
/**
 * Writes a file to the crash report location
 * @param fileName
 * @param content
 */
function writeToFile(fileName: string, content: object) {
  const path = join(publicDir.crashDir, fileName);
  ensureDirectory(publicDir.crashDir);

  try {
    const textContent = JSON.stringify(content, null, 2);
    writeFileSync(path, textContent);
  } catch (_) {
    /** We do not handle the error here */
  }
}

/*
 * Generates a crash report
 * @param error
 */
export function generateCrashReport(maybeError: unknown) {
  const timeNow = new Date().toISOString().replaceAll(':', '_');
  const runtimeState = getState();
  const currentRundown = getCurrentRundown();
  const log = logger.dump();
  const error =
    maybeError instanceof Error
      ? {
          message: maybeError.message,
          stack: maybeError.stack || 'No stack trace available',
        }
      : String(maybeError);

  const crashReport = {
    time: timeNow,
    version: ONTIME_VERSION,
    error,
    log: log,
    runtimeState,
    currentRundown,
  };

  writeToFile(`crash-log-${timeNow}.log`, crashReport);
}
