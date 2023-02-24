import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';

// import utils
import { join, resolve } from 'path';

import { initiateOSC, shutdownOSCServer } from './controllers/OscController.js';
import { initSentry } from './modules/sentry.js';
import { currentDirectory, environment, isProduction, resolvedPath } from './setup.js';
import { ONTIME_VERSION } from './ONTIME_VERSION.js';
import { OSCSettings } from 'ontime-types';

// Import Routes
import { router as rundownRouter } from './routes/rundownRouter.js';
import { router as eventDataRouter } from './routes/eventDataRouter.js';
import { router as ontimeRouter } from './routes/ontimeRouter.js';
import { router as playbackRouter } from './routes/playbackRouter.js';

// Services
import { DataProvider } from './classes/data-provider/DataProvider.js';
import { socketProvider } from './classes/socket/SocketController.js';
import { eventTimer } from './services/TimerService.js';
import { dbLoadingProcess } from './modules/loadDb.js';
import { integrationService } from './services/integration-service/IntegrationService.js';
import { OscIntegration } from './services/integration-service/OscIntegration.js';

console.log(`Starting Ontime version ${ONTIME_VERSION}`);

if (!isProduction) {
  console.log(`Ontime running in ${environment} environment`);
  console.log(`Ontime directory at ${currentDirectory} `);
}

initSentry(environment);

// import socket provider
const socketServer = socketProvider;

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
app.use('/eventlist', rundownRouter);
app.use('/eventdata', eventDataRouter);
app.use('/ontime', ontimeRouter);
app.use('/playback', playbackRouter);

// serve static - css
app.use('/external', express.static(join(currentDirectory, 'external')));

// serve static - react, in test mode we fetch the React app from module
const newpath = join(currentDirectory, resolvedPath());
console.log('serving content at ', newpath);

app.use(express.static(join(currentDirectory, resolvedPath())));

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
  InitDB,
  InitServer,
  InitIO,
}

let step = OntimeStartOrder.InitDB;
const checkStart = (currentState: OntimeStartOrder) => {
  if (step !== currentState) {
    step = OntimeStartOrder.Error;
    throw new Error('Init order error: startDb > startServer > startOsc > startIntegrations');
  } else {
    if (step === 1 || step === 2) {
      step = step + 1;
    }
  }
};

export const startDb = async () => {
  checkStart(OntimeStartOrder.InitDB);
  await dbLoadingProcess;
};

// create HTTP server
const expressServer = http.createServer(app);

/**
 * Starts servers
 * @return {Promise<string>}
 */
export const startServer = async () => {
  checkStart(OntimeStartOrder.InitServer);

  const serverPort = 4001; // hardcoded for now
  const returnMessage = `Ontime is listening on port ${serverPort}`;
  expressServer.listen(serverPort, '0.0.0.0');

  socketServer.initServer(expressServer);
  socketServer.info('SERVER', returnMessage);
  socketServer.startListener();

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
    socketServer.info('RX', 'OSC Input Disabled');
    return;
  }

  // Setup default port
  const oscSettings = {
    ...osc,
    portIn: overrideConfig?.port || osc.portIn,
  };

  // Start OSC Server
  socketServer.info('RX', `Starting OSC Server on port: ${oscSettings.portIn}`);
  initiateOSC(oscSettings);
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

  const oscIntegration = new OscIntegration();
  const { success, message } = oscIntegration.init(osc);
  socketServer.info('RX', message);

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

  expressServer.close();
  shutdownOSCServer();
  eventTimer.shutdown();
  socketServer.shutdown();
  integrationService.shutdown();
  process.exit(exitCode);
};

process.on('exit', (code) => console.log(`Ontime exited with code: ${code}`));

process.on('unhandledRejection', async (error, promise) => {
  console.error(error, 'Error: unhandled rejection', promise);
  socketServer.error('SERVER', 'Error: unhandled rejection');
  await shutdown(1);
});

process.on('uncaughtException', async (error, promise) => {
  console.error(error, 'Error: uncaught exception', promise);
  socketServer.error('SERVER', 'Error: uncaught exception');
  await shutdown(1);
});

// register shutdown signals
process.once('SIGHUP', async () => shutdown(0));
process.once('SIGINT', async () => shutdown(0));
process.once('SIGTERM', async () => shutdown(0));
