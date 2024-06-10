import { Log, LogLevel } from 'ontime-types';
import { generateId, millisToString } from 'ontime-utils';

import { clock } from '../services/Clock.js';
import { isProduction } from '../setup/index.js';
import { socket } from '../adapters/WebsocketAdapter.js';
import { consoleRed } from '../utils/console.js';

class Logger {
  private queue: Log[];
  private escalateErrorFn: (error: string) => void | null;

  constructor() {
    this.queue = [];
    this.escalateErrorFn = null;
  }

  /**
   * Enabling setup logger after init
   */
  init(escalateErrorFn: (error: string) => void) {
    // flush logs from queue
    this.queue.forEach((log) => {
      this._push(log);
    });
    this.queue = [];

    // we only get this when running in electron
    if (escalateErrorFn) {
      this.escalateErrorFn = escalateErrorFn;
    }
  }

  private addToQueue(log: Log) {
    this.queue.push(log);
    if (this.queue.length > 100) {
      this.queue.pop();
    }
  }

  /**
   * Internal safe push method, adds log to queue if callback not available
   * @param log
   */
  private _push(log: Log) {
    if (!isProduction || log.level === LogLevel.Severe) {
      if (log.level === LogLevel.Severe) {
        consoleRed(`[${log.level}] \t ${log.origin} \t ${log.text}`);
      } else {
        // eslint-disable-next-line no-console
        console.log(`[${log.level}] \t ${log.origin} \t ${log.text}`);
      }
    }

    try {
      socket.sendAsJson({
        type: 'ontime-log',
        payload: log,
      });
    } catch (_e) {
      this.addToQueue(log);
    }
  }

  /**
   * Emits logging message
   * @param level
   * @param origin
   * @param text
   */
  emit(level: LogLevel, origin: string, text: string) {
    const log = {
      id: generateId(),
      level,
      origin,
      text,
      time: millisToString(clock.getSystemTime() || 0),
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
  error(origin: string, text: string) {
    this.emit(LogLevel.Error, origin, text);
  }

  /**
   * Utility to emit logging message of type SEVERE
   * @param origin
   * @param text
   */
  crash(origin: string, text: string) {
    this.emit(LogLevel.Severe, origin, text);
    this.escalateErrorFn?.(text);
  }

  /**
   * Shutdown logger
   */
  shutdown() {
    this.queue = [];
  }
}

export const logger = new Logger();
