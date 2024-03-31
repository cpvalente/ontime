import { HttpSettings, LogOrigin, OSCSettings, Playback, SimpleDirection, SimplePlayback } from 'ontime-types';

import 'dotenv/config';
import express from 'express';
import expressStaticGzip from 'express-static-gzip';
import http, { type Server } from 'http';
import cors from 'cors';

// import utils
import { join, resolve } from 'path';
import {
  currentDirectory,
  environment,
  isProduction,
  resolveDbPath,
  resolveExternalsDirectory,
  resolveStylesDirectory,
  resolvedPath,
} from './setup.js';
import { ONTIME_VERSION } from './ONTIME_VERSION.js';

// Import Routes
import { router as rundownRouter } from './routes/rundownRouter.js';
import { router as projectRouter } from './routes/projectRouter.js';
import { router as ontimeRouter } from './routes/ontimeRouter.js';
import { router as apiRouter } from './routes/apiRouter.js';

// Import adapters
import { OscServer } from './adapters/OscAdapter.js';
import { socket } from './adapters/WebsocketAdapter.js';
import { DataProvider } from './classes/data-provider/DataProvider.js';
import { dbLoadingProcess } from './modules/loadDb.js';

// Services
import { integrationService } from './services/integration-service/IntegrationService.js';
import { logger } from './classes/Logger.js';
import { oscIntegration } from './services/integration-service/OscIntegration.js';
import { httpIntegration } from './services/integration-service/HttpIntegration.js';
import { populateStyles } from './modules/loadStyles.js';
import { eventStore } from './stores/EventStore.js';
import { runtimeService } from './services/runtime-service/RuntimeService.js';
import { restoreService } from './services/RestoreService.js';
import { messageService } from './services/message-service/MessageService.js';
import { populateDemo } from './modules/loadDemo.js';
import { getState, updateRundownData } from './stores/runtimeState.js';
import { setRundown, getPlayableEvents } from './services/rundown-service/RundownService.js';

console.log(`Starting Ontime version ${ONTIME_VERSION}`);

if (!isProduction) {
  console.log(`Ontime running in ${environment} environment`);
  console.log(`Ontime directory at ${currentDirectory} `);
  console.log(`Ontime database at ${resolveDbPath}`);
}

// Create express APP
const app = express();
app.disable('x-powered-by');

// setup cors for all routes
app.use(cors());

// enable pre-flight cors
app.options('*', cors());

// Implement middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '1mb' }));

// Implement route endpoints
app.use('/events', rundownRouter);
app.use('/project', projectRouter);
app.use('/ontime', ontimeRouter);
app.use('/api', apiRouter);

// serve static - css
app.use('/external/styles', express.static(resolveStylesDirectory));
app.use('/external/', express.static(resolveExternalsDirectory));
app.use('/external', (req, res) => {
  res.status(404).send(`${req.originalUrl} not found`);
});

// serve static - react, in dev/test mode we fetch the React app from module
const reactAppPath = join(currentDirectory, resolvedPath());
app.use(
  expressStaticGzip(reactAppPath, {
    enableBrotli: true,
    orderPreference: ['br'],
  }),
);

app.get('*', (req, res) => {
  res.sendFile(resolve(currentDirectory, resolvedPath(), 'index.html'));
});

// Implement catch all
app.use((error, response) => {
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
let oscServer: OscServer | null = null;

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
    timer1: {
      duration: 0,
      current: 0,
      playback: SimplePlayback.Stop,
      direction: SimpleDirection.CountDown,
    },
    clientList: [],
  });

  // initialise rundown service
  const persistedRundown = DataProvider.getRundown();
  setRundown(persistedRundown);

  // TODO: do this on the init of the runtime service
  updateRundownData(getPlayableEvents());

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
 * @description starts OSC server
 * @param overrideConfig
 * @return {Promise<void>}
 */
export const startOSCServer = async (overrideConfig?: { port: number }) => {
  checkStart(OntimeStartOrder.InitIO);

  const { osc } = DataProvider.getData();

  if (!osc.enabledIn) {
    logger.info(LogOrigin.Rx, 'OSC Input Disabled');
    return;
  }

  // Setup default port
  const oscSettings = {
    ...osc,
    portIn: overrideConfig?.port || osc.portIn,
  };

  // Start OSC Server
  logger.info(LogOrigin.Rx, `Starting OSC Server on port: ${oscSettings.portIn}`);
  oscServer = new OscServer(oscSettings);
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

  expressServer?.close();
  oscServer?.shutdown();
  runtimeService.shutdown();
  integrationService.shutdown();
  logger.shutdown();
  socket.shutdown();
  process.exit(exitCode);
};

process.on('exit', (code) => console.log(`Ontime shutdown with code: ${code}`));

process.on('unhandledRejection', async (error) => {
  logger.error(LogOrigin.Server, `Error: unhandled rejection ${error}`);
  await shutdown(1);
});

process.on('uncaughtException', async (error) => {
  logger.error(LogOrigin.Server, `Error: uncaught exception ${error}`);
  await shutdown(1);
});

// register shutdown signals
process.once('SIGHUP', async () => shutdown(0));
process.once('SIGINT', async () => shutdown(0));
process.once('SIGTERM', async () => shutdown(0));
