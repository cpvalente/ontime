// get database
import { db, data } from '../app.js';

// Create controller for GET request to 'event'
// Returns ACK message
export const getAll = async (req, res) => {
  res.json(data.event);
};

// Create controller for POST request to 'event'
// Returns ACK message
export const post = async (req, res) => {
  if (!req.body) {
    res.status(400).send('No object found in request');
    return;
  }
  // TODO: validate data
  try {
    data.event = { ...data.event, ...req.body };
    db.write();
    // data.event.push({ ...req.body }).write();
    res.sendStatus(200);
  } catch (error) {
    res.status(400).send(error);
    console.log(error);
  }
};

// Create controller for GET request to 'event/title'
// Returns ACK message
export const titleGet = async (req, res) => {
  res.json(data.event.title);
};

// Create controller for POST request to 'event/title'
// Returns ACK message
export const titlePost = async (req, res) => {
  if (!req.body) {
    res.status(400).send('No object found in request');
    return;
  }

  // TODO: validate data
  try {
    data.event.assign({ title: req.body.title }).write();
    res.sendStatus(200);
  } catch (error) {
    res.status(400).send(error);
  }
};

// Create controller for GET request to '/event/url'
// Returns ACK message
export const urlGet = async (req, res) => {
  res.json(data.event.url);
};

// Create controller for POST request to '/event/url'
// Returns ACK message
export const urlPost = async (req, res) => {
  if (!req.body) {
    res.status(400).send('No object found in request');
    return;
  }

  // TODO: validate data
  try {
    data.event.assign({ url: req.body.url }).write();
    res.sendStatus(200);
  } catch (error) {
    res.status(400).send(error);
  }
};

// Create controller for GET request to 'event/publicInfo'
// Returns ACK message
export const publicInfoGet = async (req, res) => {
  res.json(data.event.publicInfo);
};

// Create controller for POST request to '/event/publicInfo'
// Returns ACK message
export const publicInfoPost = async (req, res) => {
  if (!req.body) {
    res.status(400).send('No object found in request');
    return;
  }

  // TODO: validate data
  try {
    data.event.assign({ publicInfo: req.body.publicInfo }).write();
    res.sendStatus(200);
  } catch (error) {
    res.status(400).send(error);
  }
};

// Create controller for GET request to 'event/backstageInfo'
// Returns ACK message
export const backstageInfoGet = async (req, res) => {
  res.json(data.event.backstageInfo);
};

// Create controller for POST request to '/event/info'
// Returns ACK message
export const backstageInfoPost = async (req, res) => {
  if (!req.body) {
    res.status(400).send('No object found in request');
    return;
  }

  // TODO: validate data
  try {
    data.event.assign({ backstageInfo: req.body.backstageInfo }).write();
    res.sendStatus(200);
  } catch (error) {
    res.status(400).send(error);
  }
};

// Create controller for GET request to 'event/osc'
// Returns ACK message
export const osc = async (req, res) => {
  res.send('Not yet implemented').status(500);
};
