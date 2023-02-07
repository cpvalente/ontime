import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';

// import utils
import { join, resolve } from 'path';

import { config } from './config/config.js';
import { initiateOSC, shutdownOSCServer } from './controllers/OscController.js';
import { initSentry } from './modules/sentry.js';
import { currentDirectory, environment, isProduction, resolvedPath, uiPath } from './setup.js';
import { ONTIME_VERSION } from '../../electron/version.mjs';

// Import Routes
import { router as rundownRouter } from './routes/rundownRouter.js';
import { router as eventRouter } from './routes/eventRouter.js';
import { router as ontimeRouter } from './routes/ontimeRouter.js';
import { router as playbackRouter } from './routes/playbackRouter.js';

// Services
import { DataProvider } from './classes/data-provider/DataProvider.js';
import { socketProvider } from './classes/socket/SocketController.js';
import { eventTimer } from './services/TimerService.js';
import { promise } from './modules/loadDb.js';

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
app.use('/event', eventRouter);
app.use('/ontime', ontimeRouter);
app.use('/playback', playbackRouter);

// serve static - css
app.use('/external', express.static(join(currentDirectory, 'external')));

// serve static - react, in test mode we fetch the React app from module
app.use(express.static(join(currentDirectory, resolvedPath(), uiPath)));

app.get('*', (req, res) => {
  res.sendFile(resolve(currentDirectory, resolvedPath(), uiPath, 'index.html'));
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
 */
(async () => {
  try {
    await promise;
  } catch (error) {
    console.log(error);
  }
})();

const { osc } = DataProvider.getData();
const oscIP = osc?.targetIP || config.osc.targetIP;
const oscOutPort = osc?.portOut || config.osc.portOut;
const oscInPort = osc?.port || config.osc.port;
const oscInEnabled = osc?.enabled !== undefined ? osc.enabled : config.osc.inputEnabled;
const serverPort = 4001; // hardcoded for now

/**
 * @description starts OSC server
 * @description starts OSC server
 * @param overrideConfig
 * @return {Promise<void>}
 */
export const startOSCServer = async (overrideConfig = null) => {
  if (!oscInEnabled) {
    socketServer.info('RX', 'OSC Input Disabled');
    return;
  }

  // Setup default port
  const oscSettings = {
    port: overrideConfig?.port || oscInPort,
  };

  // Start OSC Server
  socketServer.info('RX', `Starting OSC Server on port: ${oscInPort}`);
  initiateOSC(oscSettings);
};

// create HTTP server
const expressServer = http.createServer(app);

/**
 * Starts servers
 * @return {Promise<string>}
 */
export const startServer = async () => {
  // Start server
  const returnMessage = `Ontime is listening on port ${serverPort}`;
  expressServer.listen(serverPort, '0.0.0.0');

  // init socket controller
  await socketServer.initServer(expressServer);
  socketServer.info('SERVER', 'Socket initialised');

  socketServer.info('SERVER', returnMessage);
  socketServer.startListener();
  return returnMessage;
};

/**
 * starts integrations
 * @param overrideConfig
 * @return {Promise<void>}
 */
export const startIntegrations = async (overrideConfig = null) => {
  const { http } = DataProvider.getData();

  // OSC Config
  const oscConfig = {
    ip: oscIP,
    port: overrideConfig?.port || oscOutPort,
  };
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
