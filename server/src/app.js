// get environment vars
import 'dotenv/config';

// import config
import { config } from './config/config.js';

// init database
import { Low, JSONFile } from 'lowdb';

import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { getAppDataPath, ensureDirectory } from './utils/fileManagement.js';
import { validateFile } from './utils/parserUtils.js';
import { parseJson_v1 as parseJson } from './utils/parser.js';

const env = process.env.NODE_ENV || 'prod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const appPath = getAppDataPath();
const dbDirectory = join(appPath, 'data');
ensureDirectory(dbDirectory);
const dbInDisk = join(dbDirectory, config.database.filename);

const adapter = new JSONFile(dbInDisk);
export const db = new Low(adapter);

if (validateFile(dbInDisk)) {
  await db.read();
} else {
  db.data = dbModel;
}

// there is also the case of the structure being old or corrupt
// try to parse the data, make sure that all fields exist (enforce)
export const data = await parseJson(db.data, true);
db.data = data;
await db.write();

console.log(`Starting ontime version ${process.env.npm_package_version}`)

// dependencies
import express from 'express';
import http from 'http';
import cors from 'cors';
import { dbModelv1 as dbModel } from './models/dataModel.js';

// Import Routes
import { router as eventsRouter } from './routes/eventsRouter.js';
import { router as eventRouter } from './routes/eventRouter.js';
import { router as ontimeRouter } from './routes/ontimeRouter.js';
import { router as playbackRouter } from './routes/playbackRouter.js';

// Global Objects
import { EventTimer } from './classes/EventTimer.js';

// Create express APP
const app = express();

// setup cors for all routes
app.use(cors());

// enable pre-flight cors
app.options('*', cors());

// Implement middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '1mb' }));

app.use('/uploads', express.static('uploads'));

// Implement route endpoints
app.use('/events', eventsRouter);
app.use('/event', eventRouter);
app.use('/ontime', ontimeRouter);
app.use('/playback', playbackRouter);

// serve react
app.use(
  express.static(
    join(__dirname, env === 'prod' ? '../' : '../../', 'client/build'),
  ),
);

app.get('*', (req, res) => {
  res.sendFile(
    resolve(
      __dirname,
      env === 'prod' ? '../' : '../../',
      'client',
      'build',
      'index.html',
    ),
  );
});

// Implement route for errors
app.use((err, req, res, next) => {
  res.status(500).send(err.stack);
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

const osc = data.osc;
const oscIP = osc?.targetIP || config.osc.targetIP;
const oscOutPort = osc?.portOut || config.osc.portOut;
const oscInPort = osc?.port || config.osc.port;
const oscInEnabled = osc?.enabled !== undefined ? osc.enabled : config.osc.inputEnabled;

const serverPort = data.settings.serverPort || config.server.port;

// Start OSC server
import { initiateOSC, shutdownOSCServer } from './controllers/OscController.js';

export const startOSCServer = async (overrideConfig = null) => {

  if (!oscInEnabled) {
    global.timer.info('RX', 'OSC Input Disabled');
    return;
  }

  // Setup default port
  const oscSettings = {
    port: overrideConfig?.port || oscInPort,
  };

  // Start OSC Server
  global.timer.info('RX', `Starting OSC Server on port: ${oscInPort}`);
  initiateOSC(oscSettings);
};

// create HTTP server
const server = http.createServer(app);

export const startServer = async (overrideConfig = null) => {
  // Setup default port
  // const port = overrideConfig?.port || serverPort;

  /* Note: Port is hardcoded
   * need to find a good solution for sharing
   * the dynamic info with the frontend
   */
  const port = 4001;

  // Start server
  const returnMessage = `Ontime is listening on port ${port}`;
  server.listen(port, '0.0.0.0');

  // OSC Config
  const oscConfig = {
    ip: oscIP,
    port: overrideConfig?.port || oscOutPort,
  };

  // init timer
  global.timer = new EventTimer(server, config.timer, oscConfig, data.http);
  global.timer.setupWithEventList(data.events);
  global.timer.info('SERVER', returnMessage);
  return returnMessage;
};

export const shutdown = async () => {
  console.log('Node service shutdown');
  // shutdown express server
  server.close();

  // shutdown OSC Server
  shutdownOSCServer();

  // shutdown timer
  global.timer.shutdown();
};

export { server, app };
