// import json with initial data
const events = require('../data/eventsData.json');

// Create controller for GET request to '/events'
// Returns ACK message
exports.eventsGet = async (req, res) => {
  res.send({ response: 'Events Controller API' });
};

// Create controller for GET request to '/events/all'
// Returns playback state object
exports.eventsGetAll = async (req, res) => {
  res.json(events);
};
