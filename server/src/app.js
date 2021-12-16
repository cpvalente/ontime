// get environment vars
import 'dotenv/config';
import { sessionId, user } from './utils/analytics.js';
user.screenview('Node service', 'ontime').send();
user.event('NODE', 'started', 'starting node service').send();

// import config
import { config } from './config/config.js';

// init database
import { Low, JSONFile } from 'lowdb';

import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const env = process.env.NODE_ENV || 'prod';

const file = path.join(__dirname, 'data/', config.database.filename);
const adapter = new JSONFile(file);
export const db = new Low(adapter);

// dependencies
import express from 'express';
import http from 'http';
import cors from 'cors';
import { dbModelv1 as dbModel } from './models/dataModel.js';
import { parseJsonv1 as parseJson, validateFile } from './utils/parser.js';
import ua from 'universal-analytics';

// validate JSON before attempting read
let isValid = validateFile(file);

if (isValid) {
  // Read data from JSON file, this will set db.data content
  await db.read();
}

// If file.json doesn't exist, db.data will be null
// Set default data
// db.data ||= { events: [] }; NODE v15 - v16
if (db.data == null || !isValid) {
  db.data = dbModel;
  await db.write();
}

// get data
// there is also the case of the db being corrupt
// try to parse the data, make sure that all fields exist (enforce)
export const data = await parseJson(db.data, true);
db.data = data;
await db.write();

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
app.use(ua.middleware(process.env.ANALYTICS_ID, sessionId));
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
    path.join(__dirname, env === 'prod' ? '../' : '../../', 'client/build')
  )
);

app.get('*', (req, res) => {
  res.sendFile(
    path.resolve(
      __dirname,
      env === 'prod' ? '../' : '../../',
      'client',
      'build',
      'index.html'
    )
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

const serverPort = data.settings.serverPort || config.server.port;

// Start OSC server
import { initiateOSC, shutdownOSCServer } from './controllers/OscController.js';

export const startOSCServer = async (overrideConfig = null) => {
  // Setup default port
  const oscSettings = {
    port: overrideConfig?.port || oscInPort,
    ipOut: oscIP,
    portOut: oscOutPort,
  };

  // Start OSC Server
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
  const returnMessage = `HTTP Server is listening on port ${port}`;
  server.listen(port, '0.0.0.0', () => console.log(returnMessage));

  // OSC Config
  const oscConfig = {
    ip: oscIP,
    port: overrideConfig?.port || oscOutPort
  }

  // init timer
  global.timer = new EventTimer(server, config.timer, oscConfig, data.http);
  global.timer.setupWithEventList(data.events);

  return returnMessage;
};

export const shutdown = async () => {
  console.log('Node service shutdown');

  user.event('NODE', 'shutdown', 'requesting node shutdown').send();

  // shutdown express server
  server.close();

  // shutdown OSC Server
  shutdownOSCServer();

  // shutdown timer
  global.timer.shutdown();
};
