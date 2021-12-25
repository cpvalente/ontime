// Create controller for GET request to '/playback'
// Returns ACK message
export const pbGet = async (req, res) => {
  res.send(global.timer.playState);
};

// Create controller for GET request to '/playback/onAir'
// Turns onAir flag to true
export const onAir = async (req, res) => {
  global.timer.trigger('onAir') ? res.sendStatus(200) : res.sendStatus(400);
};

// Create controller for GET request to '/playback/onAir'
// Turns onAir flag to true
export const offAir = async (req, res) => {
  global.timer.trigger('offAir') ? res.sendStatus(200) : res.sendStatus(400);
};

// Create controller for GET request to '/playback/start'
// Starts timer object
export const pbStart = async (req, res) => {
  global.timer.trigger('start') ? res.sendStatus(200) : res.sendStatus(400);
};

// Create controller for GET request to '/playback/pause'
// Pauses timer object
export const pbPause = async (req, res) => {
  global.timer.trigger('pause') ? res.sendStatus(200) : res.sendStatus(400);
};

// Create controller for GET request to '/playback/stop'
// Stops timer object
export const pbStop = async (req, res) => {
  global.timer.trigger('stop') ? res.sendStatus(200) : res.sendStatus(400);
};

// Create controller for GET request to '/playback/roll'
// Sets timer object to roll mode
export const pbRoll = async (req, res) => {
  global.timer.trigger('roll') ? res.sendStatus(200) : res.sendStatus(400);
};

// Create controller for GET request to '/playback/previous'
// Sets timer object to roll mode
export const pbPrevious = async (req, res) => {
  global.timer.trigger('previous') ? res.sendStatus(200) : res.sendStatus(400);
};

// Create controller for GET request to '/playback/next'
// Sets timer object to roll mode
export const pbNext = async (req, res) => {
  global.timer.trigger('next') ? res.sendStatus(200) : res.sendStatus(400);
};

// Create controller for GET request to '/playback/unload'
// Unloads any events
export const pbUnload = async (req, res) => {
  global.timer.trigger('unload') ? res.sendStatus(200) : res.sendStatus(400);
};

// Create controller for GET request to '/playback/reload'
// Reloads current event
export const pbReload = async (req, res) => {
  global.timer.trigger('reload') ? res.sendStatus(200) : res.sendStatus(400);
};
