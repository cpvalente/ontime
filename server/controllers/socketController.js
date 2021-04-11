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

    // unsubscribe to timer
    socket.on('release-timer', () => {
      console.log('Releasing subscription');
      // avoid multiple intervals
      if (interval) clearInterval(interval);
    });

    socket.on('get-timer', () => {
      socket.emit('timer', global.timer.getObject());
    });

    socket.on('get-playstate', () => {
      socket.emit('playstate', global.timer.playState);
    });

    // playback API
    socket.on('set-presenter-text', (data) => {
      global.timer.presenterText = data;
      socket.emit('messages-presenter', global.timer.presenter);
    });

    socket.on('set-presenter-visible', (data) => {
      global.timer.presenterVisible = data;
      socket.emit('messages-presenter', global.timer.presenter);
    });

    socket.on('get-presenter', () => {
      socket.emit('messages-presenter', global.timer.presenter);
    });

    socket.on('set-public-text', (data) => {
      global.timer.publicText = data;
      socket.emit('messages-public', global.timer.public);
    });

    socket.on('set-public-visible', (data) => {
      global.timer.publicVisible = data;
      socket.emit('messages-public', global.timer.public);
    });

    socket.on('get-public', () => {
      socket.emit('messages-public', global.timer.public);
    });

  });
};

// send timer events
const emitTimer = (socket) => {
  // send current timer
  socket.emit('timer', global.timer.getObject());
};

module.exports = initiateSocket;
