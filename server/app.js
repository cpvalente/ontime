// get config
const config = require('./config.json');

// init database
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const adapter = new FileSync(config.database.filename);
const db = low(adapter);

// dependencies
const express = require('express');
const http = require('http');
const cors = require('cors');
const dataModel = require('./data/dataModel.js');

db.defaults(dataModel).write();

// export db
module.exports.db = db;

// Import Routes
const eventsRouter = require('./routes/eventsRouter.js');
const eventRouter = require('./routes/eventRouter.js');
// No settings yet
// const settingsRouter = require('./routes/settingsRouter.js');

// Setup default port
const port = process.env.PORT || config.server.port;

// Global Objects
const EventTimer = require('./classes/EventTimer.js');

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

// get data (if any)
const eventlist = db.get('events').value();

// init timer
global.timer = new EventTimer(server, config);
global.timer.setupWithEventList(eventlist);

// Start server
server.listen(port, () =>
  console.log(`HTTP Server is listening on port ${port}`)
);

// Start OSC server
const { initiateOSC } = require('./controllers/OscController.js');

initiateOSC(config.osc);
