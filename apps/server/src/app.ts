import http, { type Server } from 'http';

import 'dotenv/config';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { LogOrigin, SimpleDirection, SimplePlayback, runtimeStorePlaceholder } from 'ontime-types';
import serverTiming from 'server-timing';

import { oscServer } from './adapters/OscAdapter.js';
// Import adapters
import { socket } from './adapters/WebsocketAdapter.js';
// Import Routers
import { appRouter } from './api-data/index.js';
import { integrationRouter } from './api-integration/integration.router.js';
import { flushPendingWrites, getDataProvider } from './classes/data-provider/DataProvider.js';
// Services
import { logger } from './classes/Logger.js';
import { portManager } from './classes/port-manager/PortManager.js';
import { updateRouterPrefix } from './externals.js';
import { makeAuthenticateMiddleware, makeLoginRouter } from './middleware/authenticate.js';
// Import middleware configuration
import { bodyParser } from './middleware/bodyParser.js';
import { compressedStatic } from './middleware/staticGZip.js';
import { ONTIME_VERSION } from './ONTIME_VERSION.js';
import { getShowWelcomeDialog } from './services/app-state-service/AppStateService.js';
import * as messageService from './services/message-service/message.service.js';
import { initialiseProject } from './services/project-service/ProjectService.js';
import { restoreService } from './services/restore-service/restore.service.js';
import type { RestorePoint } from './services/restore-service/restore.type.js';
import { runtimeService } from './services/runtime-service/runtime.service.js';
import { timerConfig } from './setup/config.js';
import { environment, isProduction } from './setup/environment.js';
// import utils
import { publicDir, srcDir, srcFiles } from './setup/index.js';
import { populateDemo } from './setup/loadDemo.js';
import { populateStyles } from './setup/loadStyles.js';
import { populateTranslation } from './setup/loadTranslations.js';
import { eventStore } from './stores/EventStore.js';
import { getState } from './stores/runtimeState.js';
import { consoleError, consoleHighlight, consoleSuccess } from './utils/console.js';
import { generateCrashReport } from './utils/generateCrashReport.js';
import { getNetworkInterfaces } from './utils/network.js';
import { clearUploadfolder } from './utils/upload.js';
import { withTimeout } from './utils/withTimeout.js';

console.log('\n');
consoleHighlight(`Starting Ontime version ${ONTIME_VERSION}`);

const canLog = isProduction;
if (!canLog) {
  console.log(`Ontime running in ${environment} environment`);
  console.log(`Ontime source directory at ${srcDir.root} `);
  console.log(`Ontime public directory at ${publicDir.root} `);
}

/**
 * When running in Ontime cloud, the client is not at the root segment
 * ie: https://cloud.getontime.com/client-hash/timer
 * This means:
 * - changing the base path in the index.html file
 * - prepending all express routes with the given prefix
 */
const prefix = updateRouterPrefix();

// Create express APP
const app = express();
let isShuttingDown = false;
if (!isProduction) {
  // log server timings to requests
  app.use(serverTiming());
}
app.disable('x-powered-by');
app.enable('etag');

// Implement middleware
app.use(cors()); // setup cors for all routes
app.options('*splat', cors()); // enable pre-flight cors

app.use(bodyParser);
app.use(cookieParser());
const { authenticate, authenticateAndRedirect } = makeAuthenticateMiddleware(prefix);
const loginRouter = makeLoginRouter(prefix);

// implement health check route
app.get(`${prefix}/health`, (_req, res) => {
  res.status(200).send('OK');
});

// readiness probe route for orchestrators (e.g. kubernetes)
app.get(`${prefix}/ready`, (_req, res) => {
  if (isShuttingDown) {
    res.status(503).send('SHUTTING_DOWN');
    return;
  }
  res.status(200).send('READY');
});

// Implement route endpoints
app.use(`${prefix}/login`, loginRouter); // router for login flow
app.use(`${prefix}/data`, authenticate, appRouter); // router for application data
app.use(`${prefix}/api`, authenticate, integrationRouter); // router for integrations

// serve static external files
app.use(
  `${prefix}/external`,
  authenticateAndRedirect,
  express.static(publicDir.externalDir, { etag: false, lastModified: true }),
);
app.use(`${prefix}/external`, (req, res) => {
  // if the user reaches to the root, we show a 404
  res.status(404).send(`${req.originalUrl} not found`);
});
app.use(`${prefix}/user`, express.static(publicDir.userDir, { etag: false, lastModified: true }));

// Serve legacy timer for old browsers that don't support modern JS
app.get(`${prefix}/timer-legacy`, authenticateAndRedirect, (_req, res) => {
  res.sendFile(srcFiles.timerLegacy);
});

// Base route for static files
app.use(`${prefix}`, authenticateAndRedirect, compressedStatic);
app.use(`${prefix}/*splat`, authenticateAndRedirect, compressedStatic);

// Implement catch all
app.use((_error, response) => {
  response.status(400).send('Unhandled request');
});

/***************  START SERVICES ***************/

/* Override config
 * ----------------
 *
 * Configuration of services comes from app general config
 * It can be overridden here by the settings in the db
 * It can also be overridden on call
 *
 * Start order
 * ----------------
 *
 * The services need to be started in a certain order,
 * the enum below enforces that
 */

enum OntimeStartOrder {
  Error,
  InitAssets,
  InitServer,
  InitIO,
}

let step = OntimeStartOrder.InitAssets;
let expressServer: Server | null = null;
let shutdownPromise: Promise<void> | null = null;

const checkStart = (currentState: OntimeStartOrder) => {
  if (step !== currentState) {
    step = OntimeStartOrder.Error;
    throw new Error('Init order error: initAssets > startServer');
  } else {
    if (step === 1 || step === 2) {
      step = step + 1;
    }
  }
};

let restorePoint: RestorePoint | null = null;

export const initAssets = async (escalateErrorFn?: (error: string, unrecoverable: boolean) => void) => {
  checkStart(OntimeStartOrder.InitAssets);
  // initialise logging service, escalateErrorFn only exists in electron
  logger.init(escalateErrorFn);

  // load restore point if it exists
  restorePoint = await restoreService.load();

  await clearUploadfolder();
  populateStyles();
  populateTranslation();
  await populateDemo();
  const project = await initialiseProject();
  logger.info(LogOrigin.Server, `Initialised Ontime with ${project}`);
};

/**
 * Starts servers
 */
export const startServer = async (): Promise<{ message: string; serverPort: number }> => {
  checkStart(OntimeStartOrder.InitServer);

  // the express server must be started before the socket otherwise the on error event listener will not attach properly
  expressServer = http.createServer(app);
  const resultPort = await portManager.attachServer(expressServer);

  const showWelcome = await getShowWelcomeDialog(!!restorePoint);
  socket.init(expressServer, showWelcome, prefix);

  /**
   * Module initialises the services and provides initial payload for the store
   */
  const state = getState();
  eventStore.init({
    clock: state.clock,
    timer: state.timer,
    message: { ...runtimeStorePlaceholder.message },
    offset: state.offset,
    rundown: state.rundown,
    eventNow: state.eventNow,
    eventNext: state.eventNext,
    eventFlag: null,
    groupNow: null,
    auxtimer1: {
      duration: timerConfig.auxTimerDefault,
      current: timerConfig.auxTimerDefault,
      playback: SimplePlayback.Stop,
      direction: SimpleDirection.CountDown,
    },
    auxtimer2: {
      duration: timerConfig.auxTimerDefault,
      current: timerConfig.auxTimerDefault,
      playback: SimplePlayback.Stop,
      direction: SimpleDirection.CountDown,
    },
    auxtimer3: {
      duration: timerConfig.auxTimerDefault,
      current: timerConfig.auxTimerDefault,
      playback: SimplePlayback.Stop,
      direction: SimpleDirection.CountDown,
    },
    ping: 1,
  });

  // initialise message service
  messageService.init(eventStore.set, eventStore.get);

  // apply the restore point if it exists
  runtimeService.init(restorePoint);

  const nif = getNetworkInterfaces();
  consoleSuccess(`Local: http://localhost:${resultPort}${prefix}/editor`);
  for (const key in nif) {
    const address = nif[key].address;
    consoleSuccess(`Network: http://${address}:${resultPort}${prefix}/editor`);
  }

  const returnMessage = `Ontime is listening on port ${resultPort}`;
  logger.info(LogOrigin.Server, returnMessage);

  return {
    message: returnMessage,
    serverPort: resultPort,
  };
};

/**
 * starts integrations
 */
export const startIntegrations = async () => {
  checkStart(OntimeStartOrder.InitIO);
  const { enabledOscIn, oscPortIn } = getDataProvider().getAutomation();
  if (enabledOscIn) {
    oscServer.init(oscPortIn);
  } else {
    logger.info(LogOrigin.Server, 'Skipping OSC integration');
  }
};

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

const closeHttpServer = async (server: Server | null): Promise<void> => {
  if (!server) return;

  const closePromise = new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        if ((error as NodeJS.ErrnoException).code === 'ERR_SERVER_NOT_RUNNING') {
          resolve();
          return;
        }
        reject(error);
        return;
      }
      resolve();
    });
  });

  server.closeIdleConnections();
  server.closeAllConnections();

  await closePromise;
};

const shutdownGlobalTimeout = 10_000; // 10 seconds
const shutdownTimeout = 4_000; // 4 seconds

async function performShutdown(exitCode: number): Promise<void> {
  isShuttingDown = true;
  consoleHighlight(`Ontime shutting down with code ${exitCode}`);

  // if shutdown takes longer than 10 seconds, force exit to avoid hanging processes
  const forceExitTimer = setTimeout(() => {
    consoleError('Forced shutdown after timeout');
    process.exit(exitCode);
  }, shutdownGlobalTimeout);

  try {
    runtimeService.shutdown();

    // Block for at most 4 seconds on each shutdown segment
    await withTimeout(
      flushPendingWrites().catch((_error) => {
        /** nothing do to here */
      }),
      shutdownTimeout,
    );

    // clear the restore file if it was a normal exit
    // 0 means it was a SIGNAL
    // 1 means crash -> keep the file
    // 2 means dev crash -> do nothing
    // 3 means container shutdown -> keep the file
    // 99 means there was a shutdown request from the UI
    if (exitCode === 0 || exitCode === 99) {
      await withTimeout(restoreService.clear(), shutdownTimeout);
      await withTimeout(portManager.shutdown(), shutdownTimeout);
    }

    await withTimeout(
      Promise.all([closeHttpServer(expressServer), socket.shutdown(), oscServer.shutdown()]),
      shutdownTimeout,
    );
  } catch (error) {
    logger.error(LogOrigin.Server, `Shutdown error: ${error}`, false);
  } finally {
    clearTimeout(forceExitTimer);
    logger.shutdown();
    process.exit(exitCode);
  }
}

process.on('exit', (code) => consoleHighlight(`Ontime shutdown with code: ${code}`));

process.on('unhandledRejection', async (error) => {
  if (!isProduction && error instanceof Error && error.stack) {
    consoleError(error.stack);
  }
  generateCrashReport(error);
  logger.crash(LogOrigin.Server, `Uncaught rejection | ${error}`);
  await shutdown(1);
});

process.on('uncaughtException', async (error) => {
  if (!isProduction && error instanceof Error && error.stack) {
    consoleError(error.stack);
  }
  generateCrashReport(error);
  logger.crash(LogOrigin.Server, `Uncaught exception | ${error}`);
  await shutdown(1);
});

// register shutdown signals
process.once('SIGHUP', async () => shutdown(0));
process.once('SIGINT', async () => shutdown(0));
process.once('SIGTERM', async () => shutdown(3));
