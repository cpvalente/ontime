import { isProduction } from '../setup/index.js';
import { consoleError } from '../utils/console.js';

/**
 * Milestone checker for dev environment
 * will terminate process if check returns true
 * Ideally we would like to remove the call to this function on build
 */
export function shouldCrashDev(check: boolean, reason: string) {
  if (isProduction) {
    return;
  }

  if (!check) {
    return;
  }

  consoleError(new Error(reason).stack ?? '');
  process.exit(2);
}
