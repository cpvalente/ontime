/**
 * Keeps a record of when the server was last interacted with.
 *
 * Hosted environments use this to know whether an instance can be suspended:
 * a stage that nobody has touched for a long period can be stopped and
 * started again on the next request, without interrupting anyone.
 *
 * This module is intentionally free of dependencies to avoid import cycles:
 * it is written to from the adapters and read from the session service.
 */

let lastActivity: Date | null = null;

/** Registers that the server has been interacted with */
export function trackActivity(): void {
  lastActivity = new Date();
}

/** Time of the last interaction with the server, null if there was none */
export function getLastActivity(): Date | null {
  return lastActivity;
}

/** Utility for testing */
export function clearActivity(): void {
  lastActivity = null;
}
