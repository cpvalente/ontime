import { writeFileSync } from 'fs';
import { join } from 'path';

import { ONTIME_VERSION } from '../ONTIME_VERSION.js';
import { get } from '../services/rundown-service/rundownCache.js';
import { getState } from '../stores/runtimeState.js';
import { resolveCrashReportDirectory } from '../setup/index.js';

/**
 * Writes a file to the crash report location
 * @param fileName
 * @param content
 */
function writeToFile(fileName: string, content: object) {
  const path = join(resolveCrashReportDirectory, fileName);
  try {
    const textContent = JSON.stringify(content, null, 2);
    writeFileSync(path, textContent);
  } catch (e_rror) {
    /** We do not handle the error here */
  }
}

/*
 * Generates a crash report
 * @param error
 */
export function generateCrashReport(maybeError: unknown) {
  const timeNow = new Date().toISOString();
  const runtimeState = getState();
  const rundownState = get();
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
    runtimeState,
    rundownState,
  };

  writeToFile(`crash-log-${timeNow}.log`, crashReport);
}
