// get config
const config = require('./config.json');

// init database
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync(config.database.filename);
const db = low(adapter);
db.defaults({ events: [] }).write();

// export db
module.exports.db = db;

// dependencies
const express = require('express');
const http = require('http');
const cors = require('cors');

// Import Routes
const eventsRouter = require('./routes/eventsRouter.js');
const playbackRouter = require('./routes/playbackRouter.js');

// Setup default port
const port = process.env.PORT || config.server.port;

// Global Objects
const EventTimer = require('./classes/EventTimer.js');

// get data (if any)
const eventlist = db.get('events').sortBy('order').value();

// init timer
global.timer = new EventTimer();
timer.setupWithEventList(eventlist);

// Socket
const initiateSocket = require('./controllers/socketController.js');

// Create express APP
const app = express();

// setup cors for all routes
app.use(cors());

// Implement middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Implement route endpoints
app.use('/events', eventsRouter);
app.use('/playback', playbackRouter);

// implement general router
app.get('/', function (req, res) {
  res.send('ontime API');
});

// Implement route for errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// create HTTP server
const server = http.createServer(app);

// start socket server
initiateSocket(server, config);

// Start server
server.listen(port, () => console.log(`Listening on port ${port}`));
