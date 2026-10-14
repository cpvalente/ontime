import { LogOrigin } from 'ontime-types';

import * as logger from '../../logs/logs.service.js';

/** targets whose last send failed, automations can send every second */
const failingTargets = new Set<string>();

/**
 * Logs a failure to send to a target, unless the target is already failing
 */
export function reportSendFailure(
  target: string,
  message: string,
  fields: Record<string, string | number | undefined> = {},
) {
  if (failingTargets.has(target)) {
    return;
  }
  failingTargets.add(target);
  logger.warning(LogOrigin.Automation, message, { target, ...fields });
}

/**
 * Marks a target as reachable, so its next failure is logged
 */
export function reportSendSuccess(target: string) {
  failingTargets.delete(target);
}
