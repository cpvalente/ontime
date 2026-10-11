import { LogOrigin } from 'ontime-types';

import { logger } from '../../../classes/Logger.js';

/** last failure logged per target, automations can send every second */
const lastFailure = new Map<string, string>();

/**
 * Logs a failure to send to a target, unless it repeats the last failure for that target
 */
export function reportSendFailure(target: string, text: string) {
  if (lastFailure.get(target) === text) {
    return;
  }
  lastFailure.set(target, text);
  logger.warning(LogOrigin.Tx, text);
}

/**
 * Marks a target as reachable, so its next failure is logged
 */
export function reportSendSuccess(target: string) {
  lastFailure.delete(target);
}
