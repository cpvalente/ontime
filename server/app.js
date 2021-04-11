// get config
const config = require('./config.json');

// dependencies
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
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

// initialise socketIO server
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Torbjorn: should the interval be here or inside the connection?
//  I am guessing one interval per timer
// interval function
let interval;

io.on('connection', (socket) => {
  console.log('New client connected');

  // let interval = null;

  // subscribe to timer
  socket.on('subscribe-to-timer', () => {
    console.log('New subscription');
    // avoid multiple intervals
    if (interval) clearInterval(interval);

    // send current data
    socket.emit('timer', timer.getObject());

    // set callback for timer events
    interval = setInterval(() => emitTimer(socket), config.timer.refresh);
  });

  // unsubscribe to timer
  socket.on('release-timer', () => {
    console.log('Releasing subscription');
    // avoid multiple intervals
    if (interval) clearInterval(interval);
  });

  socket.on('get-timer', () => {
    socket.emit('timer', timer.getObject());
  });

  socket.on('get-playstate', () => {
    socket.emit('playstate', timer.playState);
  });

  // playback API
  socket.on('set-presenter-text', (data) => {
    timer.presenterText = data;
    socket.emit('messages-presenter', timer.presenter);
  });

  socket.on('set-presenter-visible', (data) => {
    timer.presenterVisible = data;
    socket.emit('messages-presenter', timer.presenter);
  });

  socket.on('get-presenter', () => {
    socket.emit('messages-presenter', timer.presenter);
  });

  socket.on('set-public-text', (data) => {
    timer.publicText = data;
    socket.emit('messages-public', timer.public);
  });

  socket.on('set-public-visible', (data) => {
    timer.publicVisible = data;
    socket.emit('messages-public', timer.public);
  });

  socket.on('get-public', () => {
    socket.emit('messages-public', timer.public);
  });

  // handle client disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected');
    if (interval) clearInterval(interval);
  });
});

// send timer events
const emitTimer = (socket) => {
  // send current timer
  socket.emit('timer', timer.getObject());
};

// Start server
server.listen(port, () => console.log(`Listening on port ${port}`));
