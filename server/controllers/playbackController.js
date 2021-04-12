// import json with initial data
const playbackState = require('../data/playbackData.json');

// Create controller for GET request to '/playback'
// Returns ACK message
exports.pbGet = async (req, res) => {
  // ?? Do i need to wrap this in an object?
  res.send({ response: 'Playback Controller API' });
};

// Create controller for GET request to '/playback/all'
// Returns playback state object
exports.pbGetAll = async (req, res) => {
  res.json(playbackState);
};

// Create controller for GET request to '/playback/start'
// Starts timer object
exports.pbStart = async (req, res) => {
  console.log('start request');
  global.timer.start();
  res.sendStatus(200);
};

// Create controller for GET request to '/playback/pause'
// Pauses timer object
exports.pbPause = async (req, res) => {
  console.log('pause request');
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
