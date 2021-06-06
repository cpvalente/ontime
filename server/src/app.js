// get config
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
import { dbModel } from './data/dataModel.js';

// Read data from JSON file, this will set db.data content
await db.read();

// If file.json doesn't exist, db.data will be null
// Set default data
// db.data ||= { events: [] }; NODE v15 - v16
if (db.data == null) {
  db.data = dbModel;
  db.write();
}

// get data
export const data = db.data;

// Import Routes
import { router as eventsRouter } from './routes/eventsRouter.js';
import { router as eventRouter } from './routes/eventRouter.js';
import { router as ontimeRouter } from './routes/ontimeRouter.js';

// Global Objects
import { EventTimer } from './classes/EventTimer.js';

// Create express APP
const app = express();

// setup cors for all routes
app.use(cors());

// enable pre-flight cors
app.options('*', cors());

// Implement middleware
app.use('/uploads', express.static('uploads'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '1mb' }));

// Implement route endpoints
app.use('/events', eventsRouter);
app.use('/event', eventRouter);
app.use('/ontime', ontimeRouter);

// serve react
app.use(
  express.static(
    path.join(__dirname, env == 'prod' ? '../' : '../../', 'client/build')
  )
);

app.get('*', (req, res) => {
  res.sendFile(
    path.resolve(
      __dirname,
      env == 'prod' ? '../' : '../../',
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

// create HTTP server
const server = http.createServer(app);

export const startServer = (overrideConfig = null) => {
  // Setup default port
  const serverPort = overrideConfig?.port || config.server.port;

  // Start server
  const returnMessage = `HTTP Server is listening on port ${serverPort}`;
  server.listen(serverPort, '0.0.0.0', () => console.log(returnMessage));

  // init timer
  global.timer = new EventTimer(server, config);
  global.timer.setupWithEventList(data.events);

  return returnMessage;
};

// Start OSC server
import { initiateOSC, shutdownOSCServer } from './controllers/OscController.js';

export const startOSCServer = (overrideConfig = null) => {
  // Setup default port
  const oscInPort = overrideConfig?.port || config.osc.port;
  initiateOSC(config.osc);
};

export const startOSCClient = (overrideConfig = null) => {
  // Setup default port
  const oscOutPort = overrideConfig?.port || config.osc.portOut;
  console.log('initialise OSC Client at port: ', oscOutPort);
};

export const shutdown = () => {
  console.log('Node service shutdown');

  // shutdown express server
  server.close();
  // shutdown OSC Server
  shutdownOSCServer();
  // shutdown OSC Client
};
