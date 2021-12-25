import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// get database
import { db, data } from '../app.js';
import { networkInterfaces } from 'os';
import { fileHandler } from '../utils/parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getEventTitle() {
  return data.event.title;
}

// Create controller for GET request to '/ontime/db'
// Returns -
export const dbDownload = async (req, res) => {
  const fileTitle = getEventTitle() || 'ontime events';
  const dbFile = path.resolve(__dirname, '../', 'data/db.json');

  res.download(dbFile, `${fileTitle}.json`, (err) => {
    if (err) {
      res.status(500).send({
        message: 'Could not download the file. ' + err,
      });
    }
  });
};

/**
 * @description Controller for POST request to /ontime/db
 * @returns none
 */
const upload = async (file, req, res) => {
  if (!fs.existsSync(file)) {
    res.status(500).send({ message: 'Upload failed' });
    return;
  }

  try {
    const result = await fileHandler(file);

    if (result?.error) {
      res.status(400).send({ message: result.message });
    } else if (result.message === 'success') {
      if (result.data != null) {
        if (result.data?.events != null) {
          data.events = result.data.events;
          global.timer.setupWithEventList(result.data?.events);
        }
        if (result.data?.event != null) {
          data.event = result.data.event;
        }
        if (result.data?.settings != null) {
          data.settings = result.data.settings;
        }
        db.write();
      }
      res.sendStatus(200);
    } else {
      res.status(400).send({ message: 'Failed parsing, no data' });
    }
  } catch (error) {
    res.status(400).send({ message: `Failed parsing ${error}` });
  }
};

/**
 * @description Gets information on IPV4 non internal interfaces
 * @returns {array} - Array of objects {name: ip}
 */
const getNetworkInterfaces = () => {
  const nets = networkInterfaces();
  const results = [];

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (net.family === 'IPv4' && !net.internal) {
        results.push({
          name: name,
          address: net.address,
        });
      }
    }
  }

  return results;
};

// Create controller for POST request to '/ontime/info'
// Returns -
export const getInfo = async (req, res) => {
  const version = data.settings.version;
  const serverPort = data.settings.serverPort;

  const osc = {
    port: data.osc.port,
    portOut: data.osc.portOut,
    targetIP: data.osc.targetIP,
    enabled: data.osc.enabled,
  };

  // get nif and inject localhost
  const ni = getNetworkInterfaces();
  ni.unshift({ name: 'localhost', address: '127.0.0.1' });

  // send object with network information
  res.status(200).send({
    networkInterfaces: ni,
    version,
    serverPort,
    osc,
  });
};

// Create controller for POST request to '/ontime/info'
// Returns ACK message
export const postInfo = async (req, res) => {
  if (!req.body) {
    res.status(400).send('No object found in request');
    return;
  }
  // TODO: validate data
  try {
    data.settings = { ...data.settings, ...req.body };
    await db.write();
    res.sendStatus(200);
  } catch (error) {
    res.status(400).send(error);
  }
};

// Create controller for POST request to '/ontime/osc'
// Returns -
export const getOSC = async (req, res) => {
  // send object with network information
  res.status(200).send(data.osc);
};

// Create controller for POST request to '/ontime/osc'
// Returns ACK message
export const postOSC = async (req, res) => {
  if (!req.body) {
    res.status(400).send('No object found in request');
    return;
  }
  // TODO: validate data
  try {
    data.osc = { ...data.osc, ...req.body };
    await db.write();
    res.sendStatus(200);
  } catch (error) {
    res.status(400).send(error);
    console.log(error);
  }
};

// Create controller for POST request to '/ontime/db'
// Returns -
export const dbUpload = async (req, res) => {
  if (!req.file) {
    res.status(400).send({ message: 'File not found' });
    return;
  }

  const file = req.file.path;
  upload(file, req, res);
};

// Create controller for POST request to '/ontime/dbpath'
// Returns -
export const dbPathToUpload = async (req, res) => {
  if (!req.body.path) {
    res.status(400).send({ message: 'Path to file not found' });
    return;
  }
  upload(req.body.path, req, res);
};
