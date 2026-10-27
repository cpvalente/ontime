import http, { type Server } from 'http';

import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { LogOrigin, type ProjectStartup, SimpleDirection, SimplePlayback, runtimeStorePlaceholder } from 'ontime-types';
import serverTiming from 'server-timing';

import { oscServer } from './adapters/OscAdapter.js';
// Import adapters
import { socket } from './adapters/WebsocketAdapter.js';
// Import Routers
import { appRouter } from './api-data/index.js';
import { createSessionLog } from './api-data/logs/logs.dao.js';
// Services
import * as logger from './api-data/logs/logs.service.js';
import { integrationRouter } from './api-integration/integration.router.js';
import { flushPendingWrites, getDataProvider } from './classes/data-provider/DataProvider.js';
import { portManager } from './classes/port-manager/PortManager.js';
import { updateRouterPrefix } from './externals.js';
import { makeAuthenticateMiddleware, makeLoginRouter } from './middleware/authenticate.js';
// Import middleware configuration
import { bodyParser } from './middleware/bodyParser.js';
import { compressData } from './middleware/compression.middleware.js';
import { compressedStatic } from './middleware/staticGZip.js';
import { clearUploadfolder } from './middleware/upload.js';
import { endSession, getShowWelcomeDialog, startSession } from './services/app-state-service/appState.service.js';
import { auxTimerService } from './services/aux-timer-service/auxTimer.service.js';
import * as messageService from './services/message-service/message.service.js';
import { initialiseProject } from './services/project-service/project.service.js';
import { shouldShowWelcome } from './services/project-service/project.utils.js';
import { restoreService } from './services/restore-service/restore.service.js';
import type { RestorePoint } from './services/restore-service/restore.types.js';
import { runtimeService } from './services/runtime-service/runtime.service.js';
import { config, timerConfig } from './setup/config.js';
import { isProduction } from './setup/environment.js';
// import utils
import { publicDir, publicFiles, srcFiles } from './setup/index.js';
import { populateDemo } from './setup/loadDemo.js';
import { populateStyles } from './setup/loadStyles.js';
import { populateTranslation } from './setup/loadTranslations.js';
import { eventStore } from './stores/EventStore.js';
import { getState } from './stores/runtimeState.js';
import { consoleSuccess } from './utils/console.js';
import { ensureDirectory } from './utils/fileManagement.js';
import { getNetworkInterfaces } from './utils/network.js';
import { withTimeout } from './utils/withTimeout.js';

/**
 * Ontime server lifecycle: http app, services start order and teardown
 * Process concerns (signals, crash handling, exit) live in app.ts
 */

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
app.use(`${prefix}/data`, authenticate, compressData, appRouter); // router for application data
app.use(`${prefix}/api`, authenticate, integrationRouter); // router for integrations
app.use(`${prefix}/mcp`, authenticate, async (req, res, next) => {
  const { mcpRouter } = await import('./api-mcp/mcp.router.js');
  mcpRouter(req, res, next);
});

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
// dotfiles must be allowed since the install path can contain dot directories (eg AppImage mounts in /tmp/.mount_*)
app.get(`${prefix}/timer-legacy`, authenticateAndRedirect, (_req, res) => {
  res.sendFile(srcFiles.timerLegacy, { dotfiles: 'allow' });
});

// Base route for static files
app.use(`${prefix}`, authenticateAndRedirect, compressedStatic);
app.use(`${prefix}/*splat`, authenticateAndRedirect, compressedStatic);

// answers requests no route above matched
app.use((_req, res) => {
  res.status(400).send('Unhandled request');
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
let projectStartup: ProjectStartup | null = null;

export const initAssets = async (escalateErrorFn?: (error: string, unrecoverable: boolean) => void) => {
  checkStart(OntimeStartOrder.InitAssets);
  // initialise logging service, escalateErrorFn only exists in electron
  ensureDirectory(publicDir.logsDir);
  const sessionLog = createSessionLog(publicFiles.logFile, publicFiles.previousLogFile);
  logger.init(sessionLog, escalateErrorFn);

  const previousEndedCleanly = await startSession();
  if (!previousEndedCleanly) {
    logger.warning(LogOrigin.Server, 'Previous session did not end cleanly', { log: config.logs.previous });
  }

  // load restore point if it exists
  restorePoint = await restoreService.load();

  await clearUploadfolder();
  populateStyles();
  populateTranslation();
  await populateDemo();
  projectStartup = await initialiseProject();
};

/**
 * Starts servers
 */
export const startServer = async (): Promise<{ message: string; serverPort: number }> => {
  checkStart(OntimeStartOrder.InitServer);

  // the express server must be started before the socket otherwise the on error event listener will not attach properly
  expressServer = http.createServer(app);
  const resultPort = await portManager.attachServer(expressServer);

  const projectId = getDataProvider().getProjectId();
  const restored = restoreService.forProject(restorePoint, projectId);
  restoreService.initialise(restored);
  const showWelcome =
    projectStartup && shouldShowWelcome(projectStartup, restored?.runtime !== undefined, await getShowWelcomeDialog());
  socket.init(expressServer, showWelcome ? projectStartup : null, prefix);

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
      name: '',
    },
    auxtimer2: {
      duration: timerConfig.auxTimerDefault,
      current: timerConfig.auxTimerDefault,
      playback: SimplePlayback.Stop,
      direction: SimpleDirection.CountDown,
      name: '',
    },
    auxtimer3: {
      duration: timerConfig.auxTimerDefault,
      current: timerConfig.auxTimerDefault,
      playback: SimplePlayback.Stop,
      direction: SimpleDirection.CountDown,
      name: '',
    },
    ping: 1,
  });

  // must run after eventStore.init, which would otherwise discard the names
  auxTimerService.loadNames(getDataProvider().getSettings().auxTimerNames);

  // initialise message service
  messageService.init(eventStore.set, eventStore.get);

  // apply the restore point if it exists
  runtimeService.init(restored?.runtime ?? null);

  if (restored?.auxTimers) {
    auxTimerService.resume(restored.auxTimers);
  }

  const nif = getNetworkInterfaces();
  consoleSuccess(`Local: http://localhost:${resultPort}${prefix}/editor`);
  for (const key in nif) {
    const address = nif[key].address;
    consoleSuccess(`Network: http://${address}:${resultPort}${prefix}/editor`);
  }

  const returnMessage = `Ontime is listening on port ${resultPort}`;
  logger.info(LogOrigin.Server, 'Server started', { port: resultPort });

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
    logger.info(LogOrigin.Api, 'OSC input disabled');
  }
};

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

const shutdownTimeout = 4_000; // 4 seconds

/**
 * Stops services and releases their resources, without exiting the process
 * @param exitCode - a clean exit (0 or 99) also clears the restore point and applies pending port changes
 */
export async function stopServices(exitCode: number): Promise<void> {
  isShuttingDown = true;
  runtimeService.shutdown();
  auxTimerService.dispose();

  // only a crash leaves the session open, recorded first so a failed cleanup cannot turn a stop into a crash
  if (exitCode === 0 || exitCode === 3 || exitCode === 99) {
    await withTimeout(
      endSession().catch((_error) => {
        // the next start reports this session as not ended cleanly
      }),
      shutdownTimeout,
    );
  }

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
  } else {
    await withTimeout(restoreService.flush(), shutdownTimeout);
  }

  await withTimeout(
    Promise.all([closeHttpServer(expressServer), socket.shutdown(), oscServer.shutdown()]),
    shutdownTimeout,
  );

  logger.info(LogOrigin.Server, 'Server stopped', { code: exitCode });
}
