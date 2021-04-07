// import json with initial data
const playbackState = require('../data/playbackData.json');

// Create controller for GET request to '/pb'
// Returns ACK message
exports.pbGet = async (req, res) => {
  // ?? Do i need to wrap this in an object?
  res.send({ response: 'Playback Controller API' });
};

// Create controller for GET request to '/pb/all'
// Returns playback state object
exports.pbGetAll = async (req, res) => {
  res.json(playbackState);
};

