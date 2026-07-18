/**
 * Expose errors where we reach invalid states
 * used mostly in shouldCrashDev patterns
 */
export class InvalidStateError extends Error {
  constructor(message: string) {
    super(message);
  }
}
