// Create controller for GET request to '/playback'
// Returns ACK message
export const pbGet = async (req, res) => {
  res.send(global.timer.playState);
};

// Create controller for GET request to '/playback/start'
// Starts timer object
export const pbStart = async (req, res) => {
  global.timer.start();
  res.sendStatus(200);
};

// Create controller for GET request to '/playback/pause'
// Pauses timer object
export const pbPause = async (req, res) => {
  global.timer.pause();
  res.sendStatus(200);
};

// Create controller for GET request to '/playback/stop'
// Stops timer object
export const pbStop = async (req, res) => {
  global.timer.stop();
  res.sendStatus(200);
};

// Create controller for GET request to '/playback/roll'
// Sets timer object to roll mode
export const pbRoll = async (req, res) => {
  global.timer.roll();
  res.sendStatus(501);
};

// Create controller for GET request to '/playback/previous'
// Sets timer object to roll mode
export const pbPrevious = async (req, res) => {
  global.timer.previous();
  res.sendStatus(200);
};

// Create controller for GET request to '/playback/next'
// Sets timer object to roll mode
export const pbNext = async (req, res) => {
  global.timer.next();
  res.sendStatus(200);
};

// Create controller for GET request to '/playback/unload'
// Unloads any events
export const pbUnload = async (req, res) => {
  global.timer.unload();
  console.log('debug: unload called');

  res.sendStatus(200);
};

// Create controller for GET request to '/playback/reload'
// Reloads current event
export const pbReload = async (req, res) => {
  global.timer.reload();
  console.log('debug: reload called');
  res.sendStatus(200);
};
