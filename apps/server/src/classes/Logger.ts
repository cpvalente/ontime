import { Log, LogLevel, MessageTag, logHistorySize } from 'ontime-types';
import { generateId, millisToString } from 'ontime-utils';

import { socket } from '../adapters/WebsocketAdapter.js';
import * as timeCore from '../lib/time-core/timeCore.js';
import { isProduction } from '../setup/environment.js';
import { consoleError, consoleSubdued } from '../utils/console.js';

class Logger {
  private queue: Log[];
  private escalateErrorFn: ((error: string, unrecoverable: boolean) => void) | null;
  private canLog = false;

  constructor() {
    this.queue = [];
    this.escalateErrorFn = null;
    this.canLog = !isProduction;
  }

  /**
   * Enabling setup logger after init
   */
  init(escalateErrorFn?: (error: string, unrecoverable: boolean) => void) {
    // we only get this when running in electron
    if (escalateErrorFn) {
      this.escalateErrorFn = escalateErrorFn;
    }
  }

  private addToQueue(log: Log) {
    this.queue.push(log);
    if (this.queue.length > logHistorySize) {
      this.queue.shift();
    }
  }

  /**
   * Internal safe push method, adds log to queue if callback not available
   * @param log
   */
  private _push(log: Log) {
    if (this.canLog || log.level === LogLevel.Severe) {
      if (log.level === LogLevel.Severe) {
        consoleError(`[${log.level}] \t ${log.origin} \t ${log.text}`);
      } else {
        consoleSubdued(`[${log.level}] \t ${log.origin} \t ${log.text}`);
      }
    }

    this.addToQueue(log);
    try {
      socket.sendAsJson(MessageTag.Log, log);
    } catch (_e) {
      /* Nothing to catch */
    }
  }

  /**
   * Emits logging message
   * @param level
   * @param origin
   * @param text
   */
  emit(level: LogLevel, origin: string, text: string) {
    const at = timeCore.now();
    const log: Log = {
      id: generateId(),
      level,
      origin,
      text,
      at,
      time: millisToString(timeCore.toTimeOfDay(at)),
    };
    this._push(log);
  }

  /**
   * Utility to emit logging message of type INFO
   * @param origin
   * @param text
   */
  info(origin: string, text: string) {
    this.emit(LogLevel.Info, origin, text);
  }

  /**
   * Utility to emit logging message of type WARN
   * @param origin
   * @param text
   */
  warning(origin: string, text: string) {
    this.emit(LogLevel.Warn, origin, text);
  }

  /**
   * Utility to emit logging message of type ERROR
   * @param origin
   * @param text
   */
  error(origin: string, text: string, escalate = false) {
    this.emit(LogLevel.Error, origin, text);
    if (escalate) {
      this.escalateErrorFn?.(text, false);
    }
  }

  /**
   * Utility to emit logging message of type SEVERE
   * @param origin
   * @param text
   */
  crash(origin: string, text: string) {
    this.emit(LogLevel.Severe, origin, text);
    this.escalateErrorFn?.(text, true);
  }

  /**
   * Returns the latest entries, oldest first
   */
  getHistory(): Log[] {
    return [...this.queue];
  }

  /**
   * Shutdown logger
   */
  shutdown() {
    this.queue = [];
  }
}

export const logger = new Logger();
