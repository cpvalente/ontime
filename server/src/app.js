// get config
import { config } from './config/config.js';

// init database
import { Low, JSONFile } from 'lowdb';

import { join } from 'path';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const file = join('data/', config.database.filename);
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

// Setup default port
const port = process.env.PORT || config.server.port;

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
app.use(express.static(path.join(__dirname, '../../client/build')));

app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../../client', 'build', 'index.html'));
});

// Implement route for errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// create HTTP server
const server = http.createServer(app);

// init timer
global.timer = new EventTimer(server, config);
global.timer.setupWithEventList(data.events);

// Start server
server.listen(port, () =>
  console.log(`HTTP Server is listening on port ${port}`)
);

// Start OSC server
import { initiateOSC } from './controllers/OscController.js';

initiateOSC(config.osc);

export function init() {
  console.log('init');
}
