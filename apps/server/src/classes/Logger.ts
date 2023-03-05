import { Log, LogLevel } from 'ontime-types';
import { generateId } from 'ontime-utils';

import { stringFromMillis } from '../utils/time.js';
import { clock } from '../services/Clock.js';
import { isProduction } from '../setup.js';

type LogMessage = {
  type: 'ontime-log';
  payload: Log;
};

class Logger {
  private push: (log: LogMessage) => void | null;
  private queue: Log[];

  constructor(emitCallback?: (message) => void) {
    this.push = emitCallback;
    this.queue = [];
  }

  /**
   * Enabling setup logger after init
   * @param emitCallback
   */
  init(emitCallback: (message) => void) {
    this.push = emitCallback;
    this.queue.forEach((log) => {
      this._push(log);
    });
    this.queue = [];
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
    if (!isProduction) {
      console.log(`[${log.level}] \t ${log.origin} \t ${log.text}`);
    }

    if (this.push) {
      try {
        this.push({
          type: 'ontime-log',
          payload: log,
        });
        console.log('DEBUG FAILED LOGGER SHOULDVE SENT')

      } catch (_e) {
        console.log('DEBUG FAILED LOGGER SEND', _e)
        this.addToQueue(log);
      }
    } else {
      this.addToQueue(log);
    }
  }

  /**
   * Emits logging message
   * @param level
   * @param origin
   * @param text
   */
  emit(level, origin: string, text: string) {
    const log = {
      id: generateId(),
      level,
      origin,
      text,
      time: stringFromMillis(clock.getSystemTime() || 0),
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
   * Shutdown logger
   */
  shutdown() {
    console.log('Shutting down logger');
    this.push = null;
    this.queue = [];
  }
}

export const logger = new Logger();
