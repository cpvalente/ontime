/* eslint-disable no-console */

/**
 * Utility function to log success messages
 */
export function consoleSuccess(message: string) {
  console.log(inGreen(message));
}

/**
 * Utility function to log error messages
 */
export function consoleError(message: string) {
  console.error(inRed(message));
}

/**
 * Utility function to log highlighted messages
 */
export function consoleHighlight(message: string) {
  console.log(inCyan(message));
}

/**
 * Utility function to log messages with subdued appearance
 */
export function consoleSubdued(message: string) {
  console.log(inGray(message));
}

/**
 * Utility function for console, styles text in green
 */
function inGreen(message: string): string {
  return `\x1b[32m${message}\x1b[0m`;
}

/**
 * Utility function for console, styles text in red
 */
function inRed(message: string): string {
  return `\x1b[31m${message}\x1b[0m`;
}

/**
 * Utility function for console, styles text in cyan
 */
function inCyan(message: string): string {
  return `\x1b[96m${message}\x1b[0m`;
}

/**
 * Utility function for console, styles text in gray
 */
function inGray(message: string): string {
  return `\x1b[2m${message}\x1b[0m`;
}
