const socketIo = require('socket.io');

const initiateSocket = (server, config) => {
  // initialise socketIO server
  const io = socketIo(server, {
    cors: {
      origin: 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  // set callback for timer events
  let interval = setInterval(() => emitTimer(io), config.timer.refresh);

  io.on('connection', (socket) => {
    /*******************************/
    /***  HANDLE NEW CONNECTION  ***/
    /***  ---------------------  ***/
    /*******************************/
    console.log(`New client connected: ${socket.id}`);

    /***************************************/
    /***  TIMER STATE GETTERS / SETTERS  ***/
    /***  -----------------------------  ***/
    /***************************************/

    // general playback state
    socket.on('get-state', () => {
      socket.emit('timer', global.timer.getObject());
      socket.emit('playstate', global.timer.playState);
      socket.emit('selected-id', global.timer.selectedEventId);
      socket.emit('titles', global.timer.titles);
    });

    // timer
    socket.on('get-current', () => {
      socket.emit('current', global.timer.getCurrentInSeconds());
    });

    socket.on('get-timer', () => {
      socket.emit('timer', global.timer.getObject());
    });

    // playstate
    socket.on('set-playstate', (data) => {
      // check state is defined
      if (data === 'start') global.timer.start();
      else if (data === 'pause') global.timer.pause();
      else if (data === 'stop') global.timer.stop();
      else if (data === 'previous') global.timer.previous();
      else if (data === 'next') global.timer.next();
      // Not yet implemented
      // else if (data === 'roll') global.timer.roll();
      // else if (data === 'release') global.timer.roll();
      broadcast(io, 'playstate', global.timer.playState);
      broadcast(io, 'selected-id', global.timer.selectedEventId);
      broadcast(io, 'titles', global.timer.titles);
    });

    socket.on('get-playstate', () => {
      socket.emit('playstate', global.timer.playState);
    });

    // titles data
    socket.on('get-selected-id', () => {
      socket.emit('selected-id', global.timer.selectedEventId);
    });

    socket.on('get-titles', () => {
      socket.emit('titles', global.timer.titles);
    });

    /*****************************/
    /***  BROADCAST            ***/
    /***  TIMER STATE GETTERS  ***/
    /***  -------------------  ***/
    /*****************************/

    // playback API
    // ? should i change the address tokeep convention?
    socket.on('get-messages', () => {
      broadcast(io, 'messages-presenter', global.timer.presenter);
      broadcast(io, 'messages-public', global.timer.public);
      broadcast(io, 'messages-lower', global.timer.lower);
    });

    /***********************************/
    /***  MESSAGE GETTERS / SETTERS  ***/
    /***  -------------------------  ***/
    /***********************************/

    // Presenter message
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

    // Public message
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

    // Lower third message
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

// broadcast given payload to given address
const broadcast = (socket, address, payload) => {
  socket.emit(address, payload);
};

// broadcast: send timer events
const emitTimer = (socket) => {
  // send current timer
  socket.emit('timer', global.timer.getObject());
};

module.exports = initiateSocket;
