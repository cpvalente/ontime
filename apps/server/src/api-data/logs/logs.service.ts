import { LogLevel } from 'ontime-types';

import * as timeCore from '../../lib/time-core/timeCore.js';
import { isProduction } from '../../setup/environment.js';
import { consoleError, consoleSubdued } from '../../utils/console.js';
import type { SessionLog } from './logs.dao.js';
import type { LogLine } from './logs.utils.js';

type LogFields = Record<string, string | number | boolean | null | undefined>;

/** values which read and search well without quotes */
const bareValue = /^[\w.:/@+-]+$/;

/**
 * Writes a message followed by its fields, eg: Automation sent title="House lights" trigger=onFinish
 * - the message never carries values, so searching it finds every case
 * - absent and empty fields are left out, values with spaces or symbols are quoted
 */
function formatText(message: string, fields: LogFields): string {
  const parts = [message];
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null || value === '') continue;
    const text = String(value);
    parts.push(`${key}=${bareValue.test(text) ? text : JSON.stringify(text)}`);
  }
  return parts.join(' ');
}

type EscalateErrorFn = (error: string, unrecoverable: boolean) => void;

/** the console only mirrors entries in development, crashes are always shown */
const canLog = !isProduction;

/** a crash report carries this many of the newest entries */
const recentSize = 100;

/** entries logged before the session log opened, written to it once it does */
let pending: LogLine[] = [];
/** the newest entries, whether or not the session log has opened */
let recent: LogLine[] = [];
let sessionLog: SessionLog | null = null;
/** shows an error in a dialog, only exists in electron */
let escalateErrorFn: EscalateErrorFn | null = null;

/**
 * Starts writing to the session log, including what was logged before it opened
 */
export function init(log: SessionLog, escalate?: EscalateErrorFn) {
  sessionLog = log;
  pending.forEach((entry) => log.append(entry));
  pending = [];

  if (escalate) {
    escalateErrorFn = escalate;
  }
}

function emit(level: LogLevel, origin: string, text: string) {
  const entry: LogLine = { at: timeCore.now(), level, origin, text };

  if (canLog || level === LogLevel.Severe) {
    if (level === LogLevel.Severe) {
      consoleError(`[${level}] \t ${origin} \t ${text}`);
    } else {
      consoleSubdued(`[${level}] \t ${origin} \t ${text}`);
    }
  }

  recent.push(entry);
  if (recent.length > recentSize) {
    recent.shift();
  }

  if (sessionLog) {
    sessionLog.append(entry);
  } else {
    pending.push(entry);
  }
}

export function info(origin: string, message: string, fields: LogFields = {}) {
  emit(LogLevel.Info, origin, formatText(message, fields));
}

export function warning(origin: string, message: string, fields: LogFields = {}) {
  emit(LogLevel.Warn, origin, formatText(message, fields));
}

/**
 * @param escalate - also shows the message in a dialog, only in electron
 */
export function error(origin: string, message: string, fields: LogFields = {}, escalate = false) {
  const text = formatText(message, fields);
  emit(LogLevel.Error, origin, text);
  if (escalate) {
    escalateErrorFn?.(text, false);
  }
}

/** Logs a crash, returning the text written */
export function crash(origin: string, message: string, fields: LogFields = {}): string {
  const text = formatText(message, fields);
  emit(LogLevel.Severe, origin, text);
  return text;
}

/** Shows a crash in a dialog, only in electron, where the dialog blocks until dismissed */
export function escalateCrash(text: string) {
  escalateErrorFn?.(text, true);
}

/** The newest entries, including those not yet in the session log */
export function getRecentEntries(): readonly LogLine[] {
  return recent;
}

/** Stops writing, the process is about to exit */
export function shutdown() {
  pending = [];
  recent = [];
  sessionLog = null;
  escalateErrorFn = null;
}
