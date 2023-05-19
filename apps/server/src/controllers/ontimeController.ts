import fs from 'fs';
import type { Alias, EventData } from 'ontime-types';
import { networkInterfaces } from 'os';
import { fileHandler } from '../utils/parser.js';
import { DataProvider } from '../classes/data-provider/DataProvider.js';
import { failEmptyObjects, failIsNotArray } from '../utils/routerUtils.js';
import { mergeObject } from '../utils/parserUtils.js';
import { PlaybackService } from '../services/PlaybackService.js';
import { eventStore } from '../stores/EventStore.js';
import { resolveDbPath } from '../setup.js';
import { oscIntegration } from '../services/integration-service/OscIntegration.js';
import { logger } from '../classes/Logger.js';
import { deleteAllEvents, forceReset } from '../services/RundownService.js';

// Create controller for GET request to '/ontime/poll'
// Returns data for current state
export const poll = async (req, res) => {
  try {
    const s = eventStore.poll();
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
  const fileTitle = title || 'ontime data';

  res.download(resolveDbPath, `${fileTitle}.json`, (err) => {
    if (err) {
      res.status(500).send({
        message: `Could not download the file: ${err}`,
      });
    }
  });
};

/**
 * handles file upload
 * @param file
 * @param req
 * @param res
 * @param [options]
 * @returns {Promise<void>}
 */
const uploadAndParse = async (file, req, res, options) => {
  if (!fs.existsSync(file)) {
    res.status(500).send({ message: 'Upload failed' });
    return;
  }

  try {
    const result = await fileHandler(file);

    if ('error' in result && result.error) {
      res.status(400).send({ message: result.message });
    } else if ('data' in result && result.message === 'success') {
      PlaybackService.stop();
      // explicitly write objects
      if (typeof result !== 'undefined') {
        const newRundown = result.data.rundown || [];
        if (options?.onlyRundown === 'true') {
          await DataProvider.setRundown(newRundown);
        } else {
          await DataProvider.mergeIntoData(result.data);
        }
      }
      forceReset();
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
    const newAliases: Alias[] = [];
    req.body.forEach((a) => {
      newAliases.push({
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
  const settings = DataProvider.getSettings();
  res.status(200).send(settings);
};

function extractPin(value: string | undefined | null, fallback: string | null): string | null {
  if (value === null) {
    return value;
  }
  if (typeof value === 'undefined') {
    return fallback;
  }
  if (value.length === 0) {
    return null;
  }
  return value;
}

// Create controller for POST request to '/ontime/settings'
// Returns ACK message
export const postSettings = async (req, res) => {
  if (failEmptyObjects(req.body, res)) {
    return;
  }
  try {
    const settings = DataProvider.getSettings();
    const editorKey = extractPin(req.body?.editorKey, settings.editorKey);
    const operatorKey = extractPin(req.body?.operatorKey, settings.operatorKey);

    let timeFormat = settings.timeFormat;
    if (req.body?.timeFormat === '12' || req.body?.timeFormat === '24') {
      timeFormat = req.body.timeFormat;
    }

    const language = req.body?.language || 'en';

    const newData = {
      ...settings,
      editorKey,
      operatorKey,
      timeFormat,
      language,
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
  const views = DataProvider.getViewSettings();
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
    const newData = {
      overrideStyles: req.body.overrideStyles,
      endMessage: req.body?.endMessage || '',
      normalColor: req.body.normalColor,
      warningColor: req.body.warningColor,
      warningThreshold: req.body.warningThreshold,
      dangerColor: req.body.dangerColor,
      dangerThreshold: req.body.dangerThreshold,
    };
    await DataProvider.setViewSettings(newData);
    res.status(200).send(newData);
  } catch (error) {
    res.status(400).send(error);
  }
};

// Create controller for GET request to '/ontime/osc'
// Returns -
export const getOSC = async (req, res) => {
  const osc = DataProvider.getOsc();
  res.status(200).send(osc);
};

export const postOscSubscriptions = async (req, res) => {
  if (failEmptyObjects(req.body, res)) {
    return;
  }

  try {
    const oscSubscriptions = req.body;
    const oscSettings = DataProvider.getOsc();
    oscSettings.subscriptions = oscSubscriptions;
    await DataProvider.setOsc(oscSettings);

    // TODO: this update could be more granular, checking that relevant data was changed
    const { message } = oscIntegration.init(oscSettings);
    logger.info('RX', message);

    res.send(oscSettings).status(200);
  } catch (error) {
    res.status(400).send(error);
  }
};

// Create controller for POST request to '/ontime/osc'
// Returns ACK message
export const postOSC = async (req, res) => {
  if (failEmptyObjects(req.body, res)) {
    return;
  }

  try {
    const oscSettings = req.body;
    await DataProvider.setOsc(oscSettings);

    // TODO: this update could be more granular, checking that relevant data was changed
    const { message } = oscIntegration.init(oscSettings);
    logger.info('RX', message);

    res.send(oscSettings).status(200);
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

// Create controller for POST request to '/ontime/new'
export const postNew = async (req, res) => {
  try {
    const newEventData: Omit<EventData, 'endMessage'> = {
      title: req.body?.title ?? '',
      publicUrl: req.body?.publicUrl ?? '',
      publicInfo: req.body?.publicInfo ?? '',
      backstageUrl: req.body?.backstageUrl ?? '',
      backstageInfo: req.body?.backstageInfo ?? '',
    };
    const newData = await DataProvider.setEventData(newEventData);
    await deleteAllEvents();
    res.status(201).send(newData);
  } catch (error) {
    res.status(400).send(error);
  }
};
