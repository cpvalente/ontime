// get database
import { db } from '../app.js';

const table = 'event';

function getSettings() {
  return db.get(table).value();
}

// Create controller for GET request to 'event'
// Returns ACK message
export const getAll = async (req, res) => {
  const settings = getSettings();
  if (settings) res.json(settings);
  else res.sendStatus(400);
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
    db.get(table)
      .assign({ ...req.body })
      .write();
    res.sendStatus(200);
  } catch (error) {
    res.status(400).send(error);
  }
};

// Create controller for GET request to 'event/title'
// Returns ACK message
export const titleGet = async (req, res) => {
  const settings = getSettings();

  if (settings) res.json(settings.title);
  else res.sendStatus(400);
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
    db.get(table).assign({ title: req.body.title }).write();
    res.sendStatus(200);
  } catch (error) {
    res.status(400).send(error);
  }
};

// Create controller for GET request to '/event/url'
// Returns ACK message
export const urlGet = async (req, res) => {
  const event = getSettings();

  if (event) res.json(event.url);
  else res.sendStatus(400);
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
    db.get(table).assign({ url: req.body.url }).write();
    res.sendStatus(200);
  } catch (error) {
    res.status(400).send(error);
  }
};

// Create controller for GET request to 'event/publicInfo'
// Returns ACK message
export const publicInfoGet = async (req, res) => {
  const settings = getSettings();

  if (settings) res.json(settings.publicInfo);
  else res.sendStatus(400);
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
    db.get(table).assign({ publicInfo: req.body.publicInfo }).write();
    res.sendStatus(200);
  } catch (error) {
    res.status(400).send(error);
  }
};

// Create controller for GET request to 'event/backstageInfo'
// Returns ACK message
export const backstageInfoGet = async (req, res) => {
  const settings = getSettings();

  if (settings) res.json(settings.backstageInfo);
  else res.sendStatus(400);
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
    db.get(table).assign({ backstageInfo: req.body.backstageInfo }).write();
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
