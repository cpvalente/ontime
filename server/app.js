// get config
const config = require('./config.json');

// dependencies
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

// Import Routes
const eventsRouter = require('./routes/eventsRouter.js');
const playbackRouter = require('./routes/playbackRouter.js');

// TODO: Move to config file
// Setup default port
const port = process.env.PORT || 4001;

// Create express APP
const app = express();

// Implement middleware
// ---

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

const Timer = require('./timer.js');
// TODO: this should be replaced by some sort of calculation
let durationForNow = 5400;
let timer = new Timer(durationForNow);

// interval function
let interval;

io.on('connection', (socket) => {
  // send initial eventdata to any new clients
  console.log('New client connected');
  socket.emit('timer', timer.getObject());

  // avoid multiple intervals
  if (interval) {
    clearInterval(interval);
  }

  // set callback for timer events
  interval = setInterval(() => getApiAndEmit(socket), config.timer.refresh);

  // handle client disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected');
    clearInterval(interval);
  });
});

// send timer events
const getApiAndEmit = (socket) => {
  const t = timer.getObject();
  // console.log(t)
  // send current timer
  socket.emit('timer', t);
};

// Start server
server.listen(port, () => console.log(`Listening on port ${port}`));
