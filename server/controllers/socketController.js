const socketIo = require('socket.io');

const initiateSocket = (server, config) => {
  // initialise socketIO server
  const io = socketIo(server, {
    cors: {
      origin: 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  let interval = null;

  // set callback for timer events
  interval = setInterval(() => emitTimer(io), config.timer.refresh);

  io.on('connection', (socket) => {
    console.log('New client connected');

    // send current data
    socket.emit('timer', global.timer.getObject());

    socket.on('get-state', () => {
      socket.emit('timer', global.timer.getObject());
      socket.emit('playstate', global.timer.playState);
      socket.emit('selected-id', global.timer.selectedEventId);
      socket.emit('titles', global.timer.titles);
    });

    socket.on('get-current', () => {
      socket.emit('current', global.timer.getCurrentInSeconds());
    });

    socket.on('get-timer', () => {
      socket.emit('timer', global.timer.getObject());
    });

    socket.on('get-playstate', () => {
      socket.emit('playstate', global.timer.playState);
    });

    socket.on('get-selected-id', () => {
      socket.emit('selected-id', global.timer.selectedEventId);
    });

    socket.on('get-titles', () => {
      socket.emit('titles', global.timer.titles);
    });

    // playback API
    socket.on('get-messages', () => {
      broadcast(io, 'messages-presenter', global.timer.presenter);
      broadcast(io, 'messages-public', global.timer.public);
      broadcast(io, 'messages-lower', global.timer.lower);
    });

    socket.on('set-presenter-text', (data) => {
      global.timer.presenterText = data;
      broadcast(io, 'messages-presenter', global.timer.presenter);
    });

    socket.on('set-presenter-visible', (data) => {
      global.timer.presenterVisible = data;
      broadcast(io, 'messages-presenter', global.timer.presenter);
    });

    socket.on('get-presenter', () => {
      socket.emit('messages-presenter', global.timer.presenter);
    });

    socket.on('set-public-text', (data) => {
      global.timer.publicText = data;
      broadcast(io, 'messages-public', global.timer.public);
    });

    socket.on('set-public-visible', (data) => {
      global.timer.publicVisible = data;
      broadcast(io, 'messages-public', global.timer.public);
    });

    socket.on('get-public', () => {
      socket.emit('messages-public', global.timer.public);
    });

    socket.on('set-lower-text', (data) => {
      global.timer.lowerText = data;
      broadcast(io, 'messages-lower', global.timer.lower);
    });

    socket.on('set-lower-visible', (data) => {
      global.timer.lowerVisible = data;
      broadcast(io, 'messages-lower', global.timer.lower);
    });

    socket.on('get-lower', () => {
      socket.emit('messages-lower', global.timer.lower);
    });
  });
};

const broadcast = (socket, address, payload) => {
  socket.emit(address, payload);
};

// broadcast: send timer events
const emitTimer = (socket) => {
  // send current timer
  socket.emit('timer', global.timer.getObject());
};

module.exports = initiateSocket;
