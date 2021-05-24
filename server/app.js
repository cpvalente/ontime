// get config
import { config } from './config.js';

// init database
import { Low, JSONFile } from 'lowdb';

const adapter = new JSONFile(config.database.filename);
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

// No settings yet
// const settingsRouter = require('./routes/settingsRouter.js');

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
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Implement route endpoints
app.use('/events', eventsRouter);
app.use('/event', eventRouter);

// implement general router
app.get('/', (req, res) => {
  res.send('ontime API');
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
