import { HttpSettings, LogOrigin, OSCSettings, Playback, SimpleDirection, SimplePlayback } from 'ontime-types';

import 'dotenv/config';
import express from 'express';
import expressStaticGzip from 'express-static-gzip';
import http, { type Server } from 'http';
import cors from 'cors';
import serverTiming from 'server-timing';

// import utils
import { resolve } from 'path';
import {
  srcDirectory,
  environment,
  isProduction,
  resolveDbPath,
  resolveExternalsDirectory,
  resolveStylesDirectory,
  resolvedPath,
} from './setup/index.js';
import { ONTIME_VERSION } from './ONTIME_VERSION.js';

// Import Routers
import { appRouter } from './api-data/index.js';
import { integrationRouter } from './api-integration/integration.router.js';

// Import adapters
import { socket } from './adapters/WebsocketAdapter.js';
import { DataProvider } from './classes/data-provider/DataProvider.js';
import { dbLoadingProcess } from './setup/loadDb.js';

// Services
import { integrationService } from './services/integration-service/IntegrationService.js';
import { logger } from './classes/Logger.js';
import { oscIntegration } from './services/integration-service/OscIntegration.js';
import { httpIntegration } from './services/integration-service/HttpIntegration.js';
import { populateStyles } from './setup/loadStyles.js';
import { eventStore } from './stores/EventStore.js';
import { runtimeService } from './services/runtime-service/RuntimeService.js';
import { restoreService } from './services/RestoreService.js';
import { messageService } from './services/message-service/MessageService.js';
import { populateDemo } from './setup/loadDemo.js';
import { getState } from './stores/runtimeState.js';
import { initRundown } from './services/rundown-service/RundownService.js';
import { generateCrashReport } from './utils/generateCrashReport.js';

console.log(`Starting Ontime version ${ONTIME_VERSION}`);

if (!isProduction) {
  console.log(`Ontime running in ${environment} environment`);
  console.log(`Ontime directory at ${srcDirectory} `);
  console.log(`Ontime database at ${resolveDbPath}`);
}

// Create express APP
const app = express();
if (process.env.NODE_ENV === 'development') {
  // log more serever timings
  app.use(serverTiming());
}
app.disable('x-powered-by');

// setup cors for all routes
app.use(cors());

// enable pre-flight cors
app.options('*', cors());

// Implement middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '1mb' }));

// Implement route endpoints
app.use('/data', appRouter); // router for application data
app.use('/api', integrationRouter); // router for integrations

// serve static - css
app.use('/external/styles', express.static(resolveStylesDirectory));
app.use('/external/', express.static(resolveExternalsDirectory));
app.use('/external', (req, res) => {
  res.status(404).send(`${req.originalUrl} not found`);
});

// serve static - react, in dev/test mode we fetch the React app from module
const reactAppPath = resolvedPath();
app.use(
  expressStaticGzip(reactAppPath, {
    enableBrotli: true,
    orderPreference: ['br'],
    // when we build the client all the react subfiles will get a hashed name we can the immutable tag
    // as the contents of a build file will never change without also changing its name
    // so the client dose not need to revalidate the file contetnts with the server
    serveStatic: { etag: false, lastModified: false, immutable: true, maxAge: '1y' },
  }),
);

app.get('*', (_req, res) => {
  res.sendFile(resolve(reactAppPath, 'index.html'));
});

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

const checkStart = (currentState: OntimeStartOrder) => {
  if (step !== currentState) {
    step = OntimeStartOrder.Error;
    throw new Error('Init order error: initAssets > startServer > startOsc > startIntegrations');
  } else {
    if (step === 1 || step === 2) {
      step = step + 1;
    }
  }
};

export const initAssets = async () => {
  checkStart(OntimeStartOrder.InitAssets);
  await dbLoadingProcess;
  populateStyles();
  populateDemo();
};

/**
 * Starts servers
 * @return {Promise<string>}
 */
export const startServer = async () => {
  checkStart(OntimeStartOrder.InitServer);

  const { serverPort } = DataProvider.getSettings();

  const returnMessage = `Ontime is listening on port ${serverPort}`;

  expressServer = http.createServer(app);
  socket.init(expressServer);
  logger.info(LogOrigin.Server, returnMessage);

  /**
   * Module initialises the services and provides initial payload for the store
   */
  const state = getState();
  eventStore.init({
    clock: state.clock,
    timer: state.timer,
    onAir: state.timer.playback !== Playback.Stop,
    message: messageService.getState(),
    runtime: state.runtime,
    eventNow: state.eventNow,
    publicEventNow: state.publicEventNow,
    eventNext: state.eventNext,
    publicEventNext: state.publicEventNext,
    auxtimer1: {
      duration: 0,
      current: 0,
      playback: SimplePlayback.Stop,
      direction: SimpleDirection.CountDown,
    },
    clientList: [],
  });

  // initialise rundown service
  const persistedRundown = DataProvider.getRundown();
  const persistedCustomFields = DataProvider.getCustomFields();
  initRundown(persistedRundown, persistedCustomFields);

  // load restore point if it exists
  const maybeRestorePoint = await restoreService.load();

  // TODO: pass event store to rundownservice
  runtimeService.init(maybeRestorePoint);

  // eventStore set is a dependency of the services that publish to it
  messageService.init(eventStore.set.bind(eventStore));

  expressServer.listen(serverPort, '0.0.0.0');

  return { message: returnMessage, serverPort };
};

/**
 * starts integrations
 */
export const startIntegrations = async (config?: { osc: OSCSettings; http: HttpSettings }) => {
  checkStart(OntimeStartOrder.InitIO);

  // if a config is not provided, we use the persisted one
  const { osc, http } = config ?? DataProvider.getData();

  if (osc) {
    logger.info(LogOrigin.Tx, 'Initialising OSC Integration...');
    try {
      oscIntegration.init(osc);
      integrationService.register(oscIntegration);
    } catch (error) {
      logger.error(LogOrigin.Tx, 'OSC Integration initialisation failed');
    }
  }

  if (http) {
    logger.info(LogOrigin.Tx, 'Initialising HTTP Integration...');
    try {
      httpIntegration.init(http);
      integrationService.register(httpIntegration);
    } catch (error) {
      logger.error(LogOrigin.Tx, `HTTP Integration initialisation failed: ${error}`);
    }
  }
};

/**
 * @description clean shutdown app services
 * @param {number} exitCode
 * @return {Promise<void>}
 */
export const shutdown = async (exitCode = 0) => {
  console.log(`Ontime shutting down with code ${exitCode}`);

  // clear the restore file if it was a normal exit
  // 0 means it was a SIGNAL
  // 1 means crash -> keep the file
  // 99 means there was a shutdown request from the UI
  if (exitCode === 0 || exitCode === 99) {
    await restoreService.clear();
  }

  // TODO: Clear token
  expressServer?.close();
  runtimeService.shutdown();
  integrationService.shutdown();
  logger.shutdown();
  socket.shutdown();
  process.exit(exitCode);
};

process.on('exit', (code) => console.log(`Ontime shutdown with code: ${code}`));

process.on('unhandledRejection', async (error) => {
  console.error('Error: unhandled rejection', error);
  generateCrashReport(error);
  logger.error(LogOrigin.Server, `Error: unhandled rejection ${error}`);
  await shutdown(1);
});

process.on('uncaughtException', async (error) => {
  console.error('Error: uncaught exception', error);
  generateCrashReport(error);
  logger.error(LogOrigin.Server, `Error: uncaught exception ${error}`);
  await shutdown(1);
});

// register shutdown signals
process.once('SIGHUP', async () => shutdown(0));
process.once('SIGINT', async () => shutdown(0));
process.once('SIGTERM', async () => shutdown(0));
