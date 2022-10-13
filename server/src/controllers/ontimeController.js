import fs from 'fs';
import { data, db } from '../app.js';
import { networkInterfaces } from 'os';
import { fileHandler } from '../utils/parser.js';
import { generateId } from '../utils/generate_id.js';
import { resolveDbPath } from '../modules/loadDb.js';
import { DataProvider } from '../classes/data-provider/DataProvider.js';

// Create controller for GET request to '/ontime/poll'
// Returns data for current state
export const poll = async (req, res) => {
  try {
    const s = global.timer.poll();
    res.status(200).send(s);
  } catch (error) {
    res.status(500).send({
      message: `Could not get sync data: ${error}`,
    });
  }
};

// Create controller for GET request to '/ontime/db'
// Returns -
export const dbDownload = async (req, res) => {
  const fileTitle = data?.event?.title || 'ontime events';
  const dbInDisk = resolveDbPath();

  res.download(dbInDisk, `${fileTitle}.json`, (err) => {
    if (err) {
      res.status(500).send({
        message: 'Could not download the file. ' + err,
      });
    }
  });
};

const uploadAndParse = async (file, req, res, options) => {
  if (!fs.existsSync(file)) {
    res.status(500).send({ message: 'Upload failed' });
    return;
  }

  try {
    const result = await fileHandler(file);

    if (result?.error) {
      res.status(400).send({ message: result.message });
    } else if (result.message === 'success') {
      // explicitly write objects
      if (typeof result !== 'undefined') {
        const uploadAll = options?.onlyEvents === 'false';
        if (uploadAll) {
          const mergedData = DataProvider.safeMerge(data, result.data);
          data.event = mergedData.event;
          data.settings = mergedData.settings;
          data.osc = mergedData.osc;
          data.http = mergedData.http;
          data.aliases = mergedData.aliases;
          data.userFields = mergedData.userFields;
        }
        data.events = result.data.events || [];
        global.timer.setupWithEventList(result.data.events || []);
        await db.write();
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

// Create controller for POST request to '/ontime/aliases'
// Returns -
export const getAliases = async (req, res) => {
  // send aliases array
  res.status(200).send(data.aliases);
};

// Create controller for POST request to '/ontime/aliases'
// Returns ACK message
export const postAliases = async (req, res) => {
  if (!req.body) {
    res.status(400).send('No object found in request');
    return;
  }
  // TODO: validate data
  try {
    const newAliases = [];
    req.body.forEach((a) => {
      newAliases.push({
        id: generateId(),
        enabled: a.enabled,
        alias: a.alias,
        pathAndParams: a.pathAndParams,
      });
    });
    data.aliases = newAliases;
    await db.write();
    res.sendStatus(200);
  } catch (error) {
    res.status(400).send(error);
  }
};

// Create controller for GET request to '/ontime/userfields'
// Returns -
export const getUserFields = async (req, res) => {
  // send userFields array
  res.status(200).send(data.userFields);
};

// Create controller for POST request to '/ontime/userfields'
// Returns ACK message
export const postUserFields = async (req, res) => {
  if (!req.body) {
    res.status(400).send('No object found in request');
    return;
  }
  try {
    const newUserFields = { ...data.userFields };
    for (const field in newUserFields) {
      if (typeof req.body[field] !== 'undefined') {
        newUserFields[field] = req.body[field];
      }
    }
    data.userFields = newUserFields;
    await db.write();
    res.sendStatus(200);
  } catch (error) {
    res.status(400).send(error);
  }
};

// Create controller for POST request to '/ontime/settings'
// Returns -
export const getSettings = async (req, res) => {
  const version = data.settings.version;
  const serverPort = data.settings.serverPort;
  const pinCode = data.settings.pinCode;
  const timeFormat = data.settings.timeFormat;

  // send object with network information
  res.status(200).send({
    version,
    serverPort,
    pinCode,
    timeFormat,
  });
};

// Create controller for POST request to '/ontime/settings'
// Returns ACK message
export const postSettings = async (req, res) => {
  if (!req.body) {
    res.status(400).send('No object found in request');
    return;
  }
  try {
    let pin = data.settings.pinCode;
    if (typeof req.body?.pinCode === 'string') {
      if (req.body?.pinCode.length === 0) {
        pin = null;
      } else if (req.body?.pinCode.length <= 4) {
        pin = req.body?.pinCode;
      }
    }

    let timeFormat = data.settings.timeFormat;
    if (typeof req.body?.timeFormat === 'string') {
      if (req.body?.timeFormat === '12' || req.body?.timeFormat === '24') {
        timeFormat = req.body.timeFormat;
      }
    }

    data.settings = {
      ...data.settings,
      pinCode: pin,
      timeFormat: timeFormat,
    };
    await db.write();
    res.sendStatus(200);
  } catch (error) {
    res.status(400).send(error);
  }
};

/**
 * @description Get view Settings
 * @method GET
 */
export const getViewSettings = async (req, res) => {
  res.status(200).send({ ...data.views });
};

/**
 * @description Change view Settings
 * @method POST
 */
export const postViewSettings = async (req, res) => {
  if (!req.body) {
    res.status(400).send('No object found in request');
    return;
  }
  try {
    data.views = {
      overrideStyles: req.body?.overrideStyles ?? data.views.overrideStyles,
    };
    await db.write();
    res.sendStatus(200);
  } catch (error) {
    res.status(400).send(error);
  }
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
  const options = req.query;
  const file = req.file.path;
  uploadAndParse(file, req, res, options);
};

// Create controller for POST request to '/ontime/dbpath'
// Returns -
export const dbPathToUpload = async (req, res) => {
  if (!req.body.path) {
    res.status(400).send({ message: 'Path to file not found' });
    return;
  }
  uploadAndParse(req.body.path, req, res);
};
