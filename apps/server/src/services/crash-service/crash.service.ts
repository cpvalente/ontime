import { readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { type Instant, LogOrigin } from 'ontime-types';
import { getErrorMessage } from 'ontime-utils';

import * as logger from '../../api-data/logs/logs.service.js';
import { formatLogLine, toLocalIsoString } from '../../api-data/logs/logs.utils.js';
import { getCurrentRundown } from '../../api-data/rundown/rundown.dao.js';
import * as timeCore from '../../lib/time-core/timeCore.js';
import { ONTIME_VERSION } from '../../ONTIME_VERSION.js';
import { systemInfo } from '../../setup/environment.js';
import { publicDir } from '../../setup/index.js';
import { getState } from '../../stores/runtimeState.js';
import { consoleError } from '../../utils/console.js';
import { ensureDirectory } from '../../utils/fileManagement.js';

/** a crash loop must not fill the disk */
const maxReports = 10;

/**
 * Records a crash: the session log names the report, the report holds the log up to and including the crash
 */
export function recordCrash(message: string, maybeError: unknown) {
  const at = timeCore.now();
  const fileName = getCrashReportName(at);
  const error = {
    message: getErrorMessage(maybeError),
    stack: maybeError instanceof Error ? maybeError.stack : undefined,
  };
  const text = logger.crash(LogOrigin.Server, message, { error: error.message, report: fileName });
  // docker and cloud operators read stderr, the crash line above is mirrored there
  if (error.stack) {
    consoleError(error.stack);
  }

  writeReport(fileName, {
    time: toLocalIsoString(at),
    version: ONTIME_VERSION,
    systemInfo,
    data: publicDir.root,
    error,
    log: logger.getRecentEntries().map((entry) => formatLogLine(entry).trimEnd()),
    runtimeState: getState(),
    currentRundown: getCurrentRundown(),
  });

  // the electron dialog blocks until dismissed, the report is written first
  logger.escalateCrash(text);
}

/** eg: crash-report-2026-11-03T21_14_03.120+01_00.json, windows does not allow colons in file names */
function getCrashReportName(at: Instant): string {
  return `crash-report-${toLocalIsoString(at).replaceAll(':', '_')}.json`;
}

function writeReport(fileName: string, report: object) {
  try {
    ensureDirectory(publicDir.crashDir);
    writeFileSync(join(publicDir.crashDir, fileName), JSON.stringify(report, null, 2));
    pruneReports(fileName);
  } catch (error) {
    logger.error(LogOrigin.Server, 'Crash report failed', { error: getErrorMessage(error) });
  }
}

/**
 * Keeps the newest reports, including those named crash-log-* by earlier versions
 * The new report always stays, a clock set back after a power loss would otherwise make it the oldest
 */
function pruneReports(keep: string) {
  readdirSync(publicDir.crashDir)
    .filter((name) => name.startsWith('crash-') && name !== keep)
    .map((name) => ({ name, modified: statSync(join(publicDir.crashDir, name)).mtimeMs }))
    .sort((a, b) => b.modified - a.modified)
    .slice(maxReports - 1)
    .forEach(({ name }) => rmSync(join(publicDir.crashDir, name), { force: true }));
}
