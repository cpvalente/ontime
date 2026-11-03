import { readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { LogOrigin } from 'ontime-types';
import { getErrorMessage } from 'ontime-utils';

import * as logger from '../../api-data/logs/logs.service.js';
import { formatLogLine, toLocalIsoString } from '../../api-data/logs/logs.utils.js';
import { getCurrentRundown } from '../../api-data/rundown/rundown.dao.js';
import { crashReportUrl, routerPrefix } from '../../externals.js';
import * as timeCore from '../../lib/time-core/timeCore.js';
import { ONTIME_VERSION } from '../../ONTIME_VERSION.js';
import { isOntimeCloud, systemInfo } from '../../setup/environment.js';
import { publicDir } from '../../setup/index.js';
import { getState } from '../../stores/runtimeState.js';
import { ensureDirectory } from '../../utils/fileManagement.js';
import { type CrashReport, describeCrashError, getCrashReportName, toCloudCrash } from './crash.utils.js';

/** a crash loop must not fill the disk */
const maxReports = 10;

/** the process waits on the upload before it exits */
const cloudTimeout = 2_000;

/**
 * Records a crash: the session log names the report, the report holds the log up to and including the crash
 * Never throws, the process is about to exit
 */
export function recordCrash(message: string, maybeError: unknown): CrashReport {
  const at = timeCore.now();
  const fileName = getCrashReportName(at);
  const error = describeCrashError(maybeError);
  const text = logger.crash(LogOrigin.Server, message, { error: error.message, report: fileName });

  const report: CrashReport = {
    time: toLocalIsoString(at),
    version: ONTIME_VERSION,
    systemInfo,
    data: publicDir.root,
    error,
    log: logger.getRecentEntries().map((entry) => formatLogLine(entry).trimEnd()),
    runtimeState: getState(),
    currentRundown: getCurrentRundown(),
  };
  writeReport(fileName, report);

  // the electron dialog blocks until dismissed, the report is written first
  logger.escalateCrash(text);
  return report;
}

function writeReport(fileName: string, report: CrashReport) {
  try {
    ensureDirectory(publicDir.crashDir);
    writeFileSync(join(publicDir.crashDir, fileName), JSON.stringify(report, null, 2));
    listReports()
      .slice(maxReports)
      .forEach(({ name }) => rmSync(join(publicDir.crashDir, name), { force: true }));
  } catch (error) {
    logger.error(LogOrigin.Server, 'Crash report failed', { error: getErrorMessage(error) });
  }
}

/** newest first, includes reports named crash-log-* by earlier versions */
function listReports(): { name: string; modified: number }[] {
  return readdirSync(publicDir.crashDir)
    .filter((name) => name.startsWith('crash-'))
    .map((name) => ({ name, modified: statSync(join(publicDir.crashDir, name)).mtimeMs }))
    .sort((a, b) => b.modified - a.modified);
}

/**
 * Names the newest crash report written since a time, eg: since the previous session started
 */
export function findCrashReport(since: number): string | undefined {
  try {
    const newest = listReports().at(0);
    return newest && newest.modified >= since ? newest.name : undefined;
  } catch (_error) {
    // no crash folder, nothing has crashed
    return undefined;
  }
}

/**
 * Sends a crash to the cloud's collector, crash data never leaves other hosts
 * Never throws, and gives up after a short timeout, the process is about to exit
 */
export async function sendCrashToCloud(
  report: CrashReport,
  target: { isCloud: boolean; url: string | undefined } = { isCloud: isOntimeCloud, url: crashReportUrl },
): Promise<void> {
  if (!target.isCloud || !target.url) {
    return;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), cloudTimeout);
  try {
    const response = await fetch(target.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toCloudCrash(report, routerPrefix ?? null)),
      signal: controller.signal,
    });
    if (!response.ok) {
      logger.error(LogOrigin.Server, 'Crash upload failed', { status: response.status });
    }
  } catch (error) {
    logger.error(LogOrigin.Server, 'Crash upload failed', { error: getErrorMessage(error) });
  } finally {
    clearTimeout(timer);
  }
}
