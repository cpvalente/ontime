import 'dotenv/config';
import { LogOrigin } from 'ontime-types';
import { getErrorMessage } from 'ontime-utils';

import * as logger from './api-data/logs/logs.service.js';
import { ONTIME_VERSION } from './ONTIME_VERSION.js';
import { stopServices } from './server.js';
import { recordCrash, sendCrashToCloud } from './services/crash-service/crash.service.js';
import { environment, isProduction } from './setup/environment.js';
import { publicDir, srcDir } from './setup/index.js';
import { consoleError, consoleHighlight } from './utils/console.js';

/**
 * Process entry for the server bundle, used by electron and the node entry (index.ts)
 * Owns process concerns: signals, crash handling and exit
 */
export { initAssets, startIntegrations, startServer } from './server.js';

console.log('\n');
consoleHighlight(`Starting Ontime version ${ONTIME_VERSION}`);

const canLog = isProduction;
if (!canLog) {
  console.log(`Ontime running in ${environment} environment`);
  console.log(`Ontime source directory at ${srcDir.root} `);
  console.log(`Ontime public directory at ${publicDir.root} `);
}

let shutdownPromise: Promise<void> | null = null;

/**
 * Clean shutdown app services
 * - it avoid concurrency issues with deduplication of request to shutdown
 * - extracts exit code to modify cleanup behaviour
 */
export async function shutdown(exitCode = 0): Promise<void> {
  if (shutdownPromise) {
    return shutdownPromise;
  }

  shutdownPromise = performShutdown(exitCode);
  return shutdownPromise;
}

const shutdownGlobalTimeout = 10_000; // 10 seconds

async function performShutdown(exitCode: number): Promise<void> {
  consoleHighlight(`Ontime shutting down with code ${exitCode}`);

  // if shutdown takes longer than 10 seconds, force exit to avoid hanging processes
  const forceExitTimer = setTimeout(() => {
    consoleError('Forced shutdown after timeout');
    process.exit(exitCode);
  }, shutdownGlobalTimeout);

  try {
    await stopServices(exitCode);
  } catch (error) {
    logger.error(LogOrigin.Server, 'Shutdown failed', { error: getErrorMessage(error) });
  } finally {
    clearTimeout(forceExitTimer);
    logger.shutdown();
    process.exit(exitCode);
  }
}

process.on('exit', (code) => consoleHighlight(`Ontime shutdown with code: ${code}`));

let isCrashing = false;

/**
 * Records a crash and exits, the first crash owns the report, later ones are only logged
 */
async function handleCrash(message: string, error: unknown) {
  if (isCrashing) {
    logger.crash(LogOrigin.Server, message, { error: getErrorMessage(error) });
    return;
  }
  isCrashing = true;

  const report = recordCrash(message, error);
  await sendCrashToCloud(report);
  await shutdown(1);
}

process.on('unhandledRejection', (error) => handleCrash('Uncaught rejection', error));
process.on('uncaughtException', (error) => handleCrash('Uncaught exception', error));

// register shutdown signals
process.once('SIGHUP', async () => shutdown(0));
process.once('SIGINT', async () => shutdown(0));
process.once('SIGTERM', async () => shutdown(3));
