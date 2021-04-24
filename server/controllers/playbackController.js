// Create controller for GET request to '/playback'
// Returns ACK message
exports.pbGet = async (req, res) => {
  res.send(global.timer.playState);
};

// Create controller for GET request to '/playback/start'
// Starts timer object
exports.pbStart = async (req, res) => {
  global.timer.start();
  res.sendStatus(200);
};

// Create controller for GET request to '/playback/pause'
// Pauses timer object
exports.pbPause = async (req, res) => {
  global.timer.pause();
  res.sendStatus(200);
};

// Create controller for GET request to '/playback/stop'
// Stops timer object
exports.pbStop = async (req, res) => {
  global.timer.stop();
  res.sendStatus(200);
};

// Create controller for GET request to '/playback/roll'
// Sets timer object to roll mode
exports.pbRoll = async (req, res) => {
  global.timer.roll();
  res.sendStatus(501);
};

// Create controller for GET request to '/playback/previous'
// Sets timer object to roll mode
exports.pbPrevious = async (req, res) => {
  global.timer.previous();
  res.sendStatus(200);
};

// Create controller for GET request to '/playback/next'
// Sets timer object to roll mode
exports.pbNext = async (req, res) => {
  global.timer.next();
  res.sendStatus(200);
};

// Create controller for GET request to '/playback/unload'
// Unloads any events
exports.pbUnload = async (req, res) => {
  global.timer.unload();
  console.log('debug: unload called')

  res.sendStatus(200);
};

// Create controller for GET request to '/playback/reload'
// Reloads current event
exports.pbReload = async (req, res) => {
  global.timer.reload();
  console.log('debug: reload called')
  res.sendStatus(200);
};
