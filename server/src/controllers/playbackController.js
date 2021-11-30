// Create controller for GET request to '/playback'
// Returns ACK message
export const pbGet = async (req, res) => {
  res.send(global.timer.playState);
};

// Create controller for GET request to '/playback/start'
// Starts timer object
export const pbStart = async (req, res) => {
  console.log('Calling start');
  global.timer.trigger('start') ? res.sendStatus(200) : res.sendStatus(400);
};

// Create controller for GET request to '/playback/pause'
// Pauses timer object
export const pbPause = async (req, res) => {
  console.log('Calling pause');
  global.timer.trigger('pause') ? res.sendStatus(200) : res.sendStatus(400);
};

// Create controller for GET request to '/playback/stop'
// Stops timer object
export const pbStop = async (req, res) => {
  console.log('Calling stop');
  global.timer.trigger('stop') ? res.sendStatus(200) : res.sendStatus(400);
};

// Create controller for GET request to '/playback/roll'
// Sets timer object to roll mode
export const pbRoll = async (req, res) => {
  console.log('Calling roll');
  global.timer.trigger('roll') ? res.sendStatus(200) : res.sendStatus(400);
};

// Create controller for GET request to '/playback/previous'
// Sets timer object to roll mode
export const pbPrevious = async (req, res) => {
  console.log('Calling previous');
  global.timer.trigger('previous') ? res.sendStatus(200) : res.sendStatus(400);
};

// Create controller for GET request to '/playback/next'
// Sets timer object to roll mode
export const pbNext = async (req, res) => {
  console.log('Calling next');
  global.timer.trigger('next') ? res.sendStatus(200) : res.sendStatus(400);
};

// Create controller for GET request to '/playback/unload'
// Unloads any events
export const pbUnload = async (req, res) => {
  console.log('Calling unload');
  global.timer.trigger('unload') ? res.sendStatus(200) : res.sendStatus(400);
};

// Create controller for GET request to '/playback/reload'
// Reloads current event
export const pbReload = async (req, res) => {
  console.log('Calling reload');
  global.timer.trigger('reload') ? res.sendStatus(200) : res.sendStatus(400);
};
