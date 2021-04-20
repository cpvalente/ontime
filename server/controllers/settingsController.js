// get database
const db = require('../app.js').db;
const table = 'settings';

function getSettings() {
  return db.get(table).value();
}

// Create controller for GET request to 'settings'
// Returns ACK message
exports.getAll = async (req, res) => {
  const settings = getSettings();
  if (settings) res.json(settings);
  else res.sendStatus(400);
};

// Create controller for POST request to 'settings'
// Returns ACK message
exports.post = async (req, res) => {
  if (!req.body) {
    res.status(400).send(`No object found in request`);
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

// Create controller for GET request to 'settings/title'
// Returns ACK message
exports.titleGet = async (req, res) => {
  const settings = getSettings();

  if (settings) res.json(settings.title);
  else res.sendStatus(400);
};

// Create controller for POST request to 'settings/title'
// Returns ACK message
exports.titlePost = async (req, res) => {
  if (!req.body) {
    res.status(400).send(`No object found in request`);
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

// Create controller for GET request to '/settings/url'
// Returns ACK message
exports.urlGet = async (req, res) => {
  let event = getEventOptions();

  if (event) res.json(event.url);
  else res.sendStatus(400);
};

// Create controller for POST request to '/settings/url'
// Returns ACK message
exports.urlPost = async (req, res) => {
  if (!req.body) {
    res.status(400).send(`No object found in request`);
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

// Create controller for GET request to 'settings/publicInfo'
// Returns ACK message
exports.publicInfoGet = async (req, res) => {
  const settings = getSettings();

  if (settings) res.json(settings.publicInfo);
  else res.sendStatus(400);
};

// Create controller for POST request to '/settings/publicInfo'
// Returns ACK message
exports.publicInfoPost = async (req, res) => {
  if (!req.body) {
    res.status(400).send(`No object found in request`);
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

// Create controller for GET request to 'settings/backstageInfo'
// Returns ACK message
exports.backstageInfoGet = async (req, res) => {
  const settings = getSettings();

  if (settings) res.json(settings.backstageInfo);
  else res.sendStatus(400);
};

// Create controller for POST request to '/settings/info'
// Returns ACK message
exports.backstageInfoPost = async (req, res) => {
  if (!req.body) {
    res.status(400).send(`No object found in request`);
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

// Create controller for GET request to 'settings/osc'
// Returns ACK message
exports.osc = async (req, res) => {
  res.send('Not yet implemented').status(500);
};
