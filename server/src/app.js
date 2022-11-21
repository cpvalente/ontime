// get environment vars
import 'dotenv/config';

// import config
import { config } from './config/config.js';

// import dependencies
import { dirname, join, resolve } from 'path';

// dependencies
import express from 'express';
import http from 'http';
import cors from 'cors';

// Import Routes
import { router as rundownRouter } from './routes/rundownRouter.js';
import { router as eventRouter } from './routes/eventRouter.js';
import { router as ontimeRouter } from './routes/ontimeRouter.js';
import { router as playbackRouter } from './routes/playbackRouter.js';

// Global Objects
import { EventTimer } from './classes/timer/EventTimer.js';
import { socketProvider } from './classes/socket/SocketController.js';

// Start OSC server
import { initiateOSC, shutdownOSCServer } from './controllers/OscController.js';
import { fileURLToPath } from 'url';
import { DataProvider } from './classes/data-provider/DataProvider.js';

// get environment
const env = process.env.NODE_ENV || 'production';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const isTest = process.env.IS_TEST;

console.log(`Starting ontime version ${process.env.npm_package_version}`);

// import socket provider
const socket = socketProvider;

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
app.use('/external', express.static(join(__dirname, 'external')));

// serve static - react, in test mode we fetch the react app from module
const resolvedPath = () => {
  const sameModule = '../';
  const siblingModule = '../../';
  if (env === 'production' && !isTest) {
    return sameModule;
  }
  return siblingModule;
};
app.use(express.static(join(__dirname, resolvedPath(), 'client/build')));

app.get('*', (req, res) => {
  res.sendFile(resolve(__dirname, resolvedPath(), 'client', 'build', 'index.html'));
});

// Implement catch all
app.use((error, response, _next) => {
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
    socket.info('RX', 'OSC Input Disabled');
    return;
  }

  // Setup default port
  const oscSettings = {
    port: overrideConfig?.port || oscInPort,
  };

  // Start OSC Server
  socket.info('RX', `Starting OSC Server on port: ${oscInPort}`);
  initiateOSC(oscSettings);
};

// create HTTP server
const server = http.createServer(app);

/**
 * @description Starts all necessary services
 * @param overrideConfig
 * @return {Promise<string>}
 */
export const startServer = async (overrideConfig = null) => {
  const { http } = DataProvider.getData();

  // Start server
  const returnMessage = `Ontime is listening on port ${serverPort}`;
  server.listen(serverPort, '0.0.0.0');

  // init socket controller
  await socket.initServer(server);
  socket.info('SERVER', 'Socket initialised');

  // OSC Config
  const oscConfig = {
    ip: oscIP,
    port: overrideConfig?.port || oscOutPort,
  };

  // init timer
  global.timer = new EventTimer(socket, config.timer, oscConfig, http);

  socket.info('SERVER', returnMessage);
  socket.startListener();
  return returnMessage;
};

/**
 * @description clean shutdown app services
 * @return {Promise<void>}
 */
export const shutdown = async () => {
  console.log('Node service shutdown');
  // shutdown express server
  server.close();

  shutdownOSCServer();
  global.timer.shutdown();
  socket.shutdown();
};

// register shutdown signals
process.once('SIGHUP', shutdown);
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);

export { server, app };
