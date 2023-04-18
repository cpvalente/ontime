import 'dotenv/config';
import express from 'express';
import expressStaticGzip from 'express-static-gzip';
import http from 'http';
import cors from 'cors';

// import utils
import { join, resolve } from 'path';

import { currentDirectory, environment, externalsStartDirectory, isProduction, resolvedPath } from './setup.js';
import { ONTIME_VERSION } from './ONTIME_VERSION.js';
import { OSCSettings } from 'ontime-types';

// Import Routes
import { router as rundownRouter } from './routes/rundownRouter.js';
import { router as eventDataRouter } from './routes/eventDataRouter.js';
import { router as ontimeRouter } from './routes/ontimeRouter.js';
import { router as playbackRouter } from './routes/playbackRouter.js';

// Import adapters
import { OscServer } from './adapters/OscAdapter.js';
import { socket } from './adapters/WebsocketAdapter.js';
import { DataProvider } from './classes/data-provider/DataProvider.js';
import { dbLoadingProcess } from './modules/loadDb.js';

// Services
import { eventTimer } from './services/TimerService.js';
import { eventLoader } from './classes/event-loader/EventLoader.js';
import { integrationService } from './services/integration-service/IntegrationService.js';
import { logger } from './classes/Logger.js';
import { oscIntegration } from './services/integration-service/OscIntegration.js';
import { populateStyles } from './modules/loadStyles.js';
import { eventStore, getInitialPayload } from './stores/EventStore.js';

console.log(`Starting Ontime version ${ONTIME_VERSION}`);

if (!isProduction) {
  console.log(`Ontime running in ${environment} environment`);
  console.log(`Ontime directory at ${currentDirectory} `);
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
app.use('/eventdata', eventDataRouter);
app.use('/ontime', ontimeRouter);
app.use('/playback', playbackRouter);

// serve static - css
app.use('/external', express.static(externalsStartDirectory));

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
let expressServer = null;
let oscServer = null;

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
};

/**
 * Starts servers
 * @return {Promise<string>}
 */
export const startServer = async () => {
  checkStart(OntimeStartOrder.InitServer);

  const serverPort = 4001; // hardcoded for now
  const returnMessage = `Ontime is listening on port ${serverPort}`;

  expressServer = http.createServer(app);

  socket.init(expressServer);

  // provide initial payload to event store
  eventLoader.init();
  eventStore.init(getInitialPayload());

  expressServer.listen(serverPort, '0.0.0.0');

  return returnMessage;
};

/**
 * @description starts OSC server
 * @description starts OSC server
 * @param overrideConfig
 * @return {Promise<void>}
 */
export const startOSCServer = async (overrideConfig = null) => {
  checkStart(OntimeStartOrder.InitIO);

  const { osc } = DataProvider.getData();

  if (!osc.enabledIn) {
    logger.info('RX', 'OSC Input Disabled');
    return;
  }

  // Setup default port
  const oscSettings = {
    ...osc,
    portIn: overrideConfig?.port || osc.portIn,
  };

  // Start OSC Server
  logger.info('RX', `Starting OSC Server on port: ${oscSettings.portIn}`);
  oscServer = new OscServer(oscSettings);
};

/**
 * starts integrations
 */
export const startIntegrations = async (config?: { osc: OSCSettings }) => {
  checkStart(OntimeStartOrder.InitIO);

  const { osc } = config ?? DataProvider.getData();

  if (!osc) {
    return 'OSC Invalid configuration';
  }

  const { success, message } = oscIntegration.init(osc);
  logger.info('RX', message);

  if (success) {
    integrationService.register(oscIntegration);
  }
};

/**
 * @description clean shutdown app services
 * @param {number} exitCode
 * @return {Promise<void>}
 */
export const shutdown = async (exitCode = 0) => {
  console.log(`Ontime shutting down with code ${exitCode}`);

  expressServer?.close();
  oscServer?.shutdown();
  eventTimer.shutdown();
  integrationService.shutdown();
  logger.shutdown();
  socket.shutdown();
  process.exit(exitCode);
};

process.on('exit', (code) => console.log(`Ontime exited with code: ${code}`));

process.on('unhandledRejection', async (error) => {
  logger.error('SERVER', `Error: unhandled rejection ${error}`);
  await shutdown(1);
});

process.on('uncaughtException', async (error) => {
  logger.error('SERVER', `Error: uncaught exception ${error}`);
  await shutdown(1);
});

// register shutdown signals
process.once('SIGHUP', async () => shutdown(0));
process.once('SIGINT', async () => shutdown(0));
process.once('SIGTERM', async () => shutdown(0));
