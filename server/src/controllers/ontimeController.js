import fs from 'fs';
import { networkInterfaces } from 'os';
import { fileHandler } from '../utils/parser.js';
import { generateId } from '../utils/generate_id.js';
import { resolveDbPath } from '../modules/loadDb.js';
import { DataProvider } from '../classes/data-provider/DataProvider.js';
import { failEmptyObjects, failIsNotArray } from '../utils/routerUtils.js';
import { mergeObject } from '../utils/parserUtils.js';

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
  const { title } = DataProvider.getEventData();
  const fileTitle = title || 'ontime events';
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
        const newEvents = result.data.events || [];
        if (options?.onlyEvents === 'true') {
          await DataProvider.setEvents(newEvents);
        } else {
          await DataProvider.mergeIntoData(result.data);
        }
        global.timer.setupWithEventList(newEvents.filter((entry) => entry.type === 'event'));
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
 * @description Gets information on IPV4 non-internal interfaces
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
  const { version, serverPort } = DataProvider.getSettings();
  const osc = DataProvider.getOsc();

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
  const aliases = DataProvider.getAliases();
  res.status(200).send(aliases);
};

// Create controller for POST request to '/ontime/aliases'
// Returns ACK message
export const postAliases = async (req, res) => {
  if (failIsNotArray(req.body, res)) {
    return;
  }
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
    await DataProvider.setAliases(newAliases);
    res.status(200).send(newAliases);
  } catch (error) {
    res.status(400).send(error);
  }
};

// Create controller for GET request to '/ontime/userfields'
// Returns -
export const getUserFields = async (req, res) => {
  const userFields = DataProvider.getUserFields();
  res.status(200).send(userFields);
};

// Create controller for POST request to '/ontime/userfields'
// Returns ACK message
export const postUserFields = async (req, res) => {
  if (failEmptyObjects(req.body, res)) {
    return;
  }
  try {
    const persistedData = DataProvider.getUserFields();
    const newData = mergeObject(persistedData, req.body);
    await DataProvider.setUserFields(newData);
    res.status(200).send(newData);
  } catch (error) {
    res.status(400).send(error);
  }
};

// Create controller for POST request to '/ontime/settings'
// Returns -
export const getSettings = async (req, res) => {
  const { version, serverPort, pinCode, timeFormat } = DataProvider.getSettings();

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
  if (failEmptyObjects(req.body, res)) {
    return;
  }
  try {
    const settings = DataProvider.getSettings();
    let pin = settings.pinCode;
    if (typeof req.body?.pinCode === 'string') {
      if (req.body?.pinCode.length === 0) {
        pin = null;
      } else if (req.body?.pinCode.length <= 4) {
        pin = req.body?.pinCode;
      }
    }

    let format = settings.timeFormat;
    if (typeof req.body?.timeFormat === 'string') {
      if (req.body?.timeFormat === '12' || req.body?.timeFormat === '24') {
        format = req.body.timeFormat;
      }
    }

    const newData = {
      ...settings,
      pinCode: pin,
      timeFormat: format,
    };
    await DataProvider.setSettings(newData);
    res.status(200).send(newData);
  } catch (error) {
    res.status(400).send(error);
  }
};

/**
 * @description Get view Settings
 * @method GET
 */
export const getViewSettings = async (req, res) => {
  const views = DataProvider.getViews();
  res.status(200).send(views);
};

/**
 * @description Change view Settings
 * @method POST
 */
export const postViewSettings = async (req, res) => {
  if (failEmptyObjects(req.body, res)) {
    return;
  }

  try {
    const newData = { overrideStyles: req.body.overrideStyles };
    await DataProvider.setViews(newData);
    res.status(200).send(newData);
  } catch (error) {
    res.status(400).send(error);
  }
};

// Create controller for POST request to '/ontime/osc'
// Returns -
export const getOSC = async (req, res) => {
  const osc = DataProvider.getOsc();
  res.status(200).send(osc);
};

// Create controller for POST request to '/ontime/osc'
// Returns ACK message
export const postOSC = async (req, res) => {
  if (failEmptyObjects(req.body, res)) {
    return;
  }

  try {
    await DataProvider.setOsc(req.body);
    res.send(req.body).status(200);
  } catch (error) {
    res.status(400).send(error);
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
  await uploadAndParse(file, req, res, options);
};

// Create controller for POST request to '/ontime/dbpath'
// Returns -
export const dbPathToUpload = async (req, res) => {
  if (!req.body.path) {
    res.status(400).send({ message: 'Path to file not found' });
    return;
  }
  await uploadAndParse(req.body.path, req, res);
};
