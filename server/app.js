// get config
const config = require('./config.json');

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
// TODO: this should be replaced by some sort of calculation
let durationForNow = 5400;
global.timer = new EventTimer();
timer.setupWithSeconds(durationForNow, true);

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
