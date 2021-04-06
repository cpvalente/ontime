const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const sampleData = require('./data/sampleData.js');

// TODO: implement timer
// TODO: - Play / pause

const port = process.env.PORT || 4001;
const index = require('./routes/index');

const app = express();
app.use(index);

// create HTTP server
const server = http.createServer(app);

// initialise socketIO server
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// timer stuff, for now
let timer = 5400;

// transmit
let interval;

io.on('connection', (socket) => {
  console.log('New client connected');
  socket.emit('eventdata', sampleData);
  if (interval) {
    clearInterval(interval);
  }
  interval = setInterval(() => getApiAndEmit(socket), 1000);
  socket.on('disconnect', () => {
    console.log('Client disconnected');
    clearInterval(interval);
  });
});

const getApiAndEmit = (socket) => {
  socket.emit('timerSeconds', timer);
  if (timer > 0) timer = timer - 1;
};

server.listen(port, () => console.log(`Listening on port ${port}`));
