/* eslint-disable no-console */

/**
 * Utility function to log messages in green
 */
export function consoleGreen(message: string) {
  console.log(`\x1b[32m${message}\x1b[0m`);
}

/**
 * Utility function to log messages in red
 */
export function consoleRed(message: string) {
  console.error(`\x1b[31m${message}\x1b[0m`);
}
