import type { Instant, Rundown } from 'ontime-types';

import { toLocalIsoString } from '../../api-data/logs/logs.utils.js';
import type { systemInfo } from '../../setup/environment.js';
import type { RuntimeState } from '../../stores/runtimeState.js';

type CrashError = { message: string; stack?: string };

export type CrashReport = {
  /** the server's local time, as in the session log */
  time: string;
  version: string;
  systemInfo: typeof systemInfo;
  data: string;
  error: CrashError;
  /** the newest session log lines, ending in the crash */
  log: string[];
  runtimeState: Readonly<RuntimeState>;
  currentRundown: Readonly<Rundown>;
};

/** the crash data a cloud instance sends, it leaves out user data: the rundown and runtime state */
export type CloudCrash = Pick<CrashReport, 'time' | 'version' | 'systemInfo' | 'error' | 'log'> & {
  instance: string | null;
};

/** eg: crash-report-2026-11-03T21_14_03.120+01_00.json, windows does not allow colons in file names */
export function getCrashReportName(at: Instant): string {
  return `crash-report-${toLocalIsoString(at).replaceAll(':', '_')}.json`;
}

export function describeCrashError(maybeError: unknown): CrashError {
  if (maybeError instanceof Error) {
    return { message: maybeError.message, stack: maybeError.stack };
  }
  return { message: String(maybeError) };
}

export function toCloudCrash(report: CrashReport, instance: string | null): CloudCrash {
  const { time, version, systemInfo, error, log } = report;
  return { time, version, systemInfo, instance, error, log };
}
