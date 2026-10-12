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

/** entries logged before the session log opened, written to it once it does */
let pending: LogLine[] = [];
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

/** Logs a crash, and shows it in a dialog in electron */
export function crash(origin: string, message: string, fields: LogFields = {}) {
  const text = formatText(message, fields);
  emit(LogLevel.Severe, origin, text);
  escalateErrorFn?.(text, true);
}

/** Stops writing, the process is about to exit */
export function shutdown() {
  pending = [];
  sessionLog = null;
}
