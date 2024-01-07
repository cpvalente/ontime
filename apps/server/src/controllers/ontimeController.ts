import { LogOrigin } from 'ontime-types';
import type { Alias, DatabaseModel, GetInfo, HttpSettings, ProjectData } from 'ontime-types';

import { RequestHandler, Request, Response } from 'express';
import fs from 'fs';
import { networkInterfaces } from 'os';

import { fileHandler } from '../utils/parser.js';
import { DataProvider } from '../classes/data-provider/DataProvider.js';
import { failEmptyObjects, failIsNotArray } from '../utils/routerUtils.js';
import { PlaybackService } from '../services/PlaybackService.js';
import { eventStore } from '../stores/EventStore.js';
import { isDocker, resolveDbPath, resolveStylesPath } from '../setup.js';
import { oscIntegration } from '../services/integration-service/OscIntegration.js';
import { httpIntegration } from '../services/integration-service/HttpIntegration.js';
import { logger } from '../classes/Logger.js';
import { deleteAllEvents, notifyChanges } from '../services/rundown-service/RundownService.js';
import { deepmerge } from 'ontime-utils';
import { runtimeCacheStore } from '../stores/cachingStore.js';
import { delayedRundownCacheKey } from '../services/rundown-service/delayedRundown.utils.js';
import { integrationService } from '../services/integration-service/IntegrationService.js';

import { sheet } from '../utils/sheetsAuth.js';

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
  const { title } = DataProvider.getProjectData();
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
 * Parses a file and returns the result objects
 * @param file
 * @param _req
 * @param _res
 * @param options
 */
async function parseFile(file, _req, _res, options) {
  if (!fs.existsSync(file)) {
    throw new Error('Upload failed');
  }
  const result = await fileHandler(file, options);
  return result.data;
}

/**
 * parse an uploaded file and apply its parsed objects
 * @param file
 * @param req
 * @param res
 * @param [options]
 * @returns {Promise<void>}
 */
const parseAndApply = async (file, _req, res, options) => {
  const result = await parseFile(file, _req, res, options);

  PlaybackService.stop();

  const newRundown = result.rundown || [];
  if (options?.onlyRundown === 'true') {
    await DataProvider.setRundown(newRundown);
  } else {
    await DataProvider.mergeIntoData(result);
  }
  notifyChanges({ timer: true, external: true, reset: true });
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

// Create controller for GET request to '/ontime/info'
// Returns -
export const getInfo = async (req: Request, res: Response<GetInfo>) => {
  const { version, serverPort } = DataProvider.getSettings();
  const osc = DataProvider.getOsc();

  // get nif and inject localhost
  const ni = getNetworkInterfaces();
  ni.unshift({ name: 'localhost', address: '127.0.0.1' });
  const cssOverride = resolveStylesPath;

  // send object with network information
  res.status(200).send({
    networkInterfaces: ni,
    version,
    serverPort,
    osc,
    cssOverride,
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
    res.status(400).send({ message: error.toString() });
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
    const newData = deepmerge(persistedData, req.body);
    await DataProvider.setUserFields(newData);
    res.status(200).send(newData);
  } catch (error) {
    res.status(400).send({ message: error.toString() });
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
    const serverPort = Number(req.body?.serverPort);
    if (isNaN(serverPort)) {
      return res.status(400).send(`Invalid value found for server port: ${req.body?.serverPort}`);
    }

    const hasChangedPort = settings.serverPort !== serverPort;

    if (isDocker && hasChangedPort) {
      return res.status(403).json({ message: 'Can`t change port when running inside docker' });
    }

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
      serverPort,
    };
    await DataProvider.setSettings(newData);
    res.status(200).send(newData);
  } catch (error) {
    res.status(400).send({ message: error.toString() });
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
    res.status(400).send({ message: error.toString() });
  }
};

// Create controller for GET request to '/ontime/osc'
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
    const oscSettings = req.body;
    await DataProvider.setOsc(oscSettings);

    integrationService.unregister(oscIntegration);

    // TODO: this update could be more granular, checking that relevant data was changed
    const { success, message } = oscIntegration.init(oscSettings);
    logger.info(LogOrigin.Tx, message);

    if (success) {
      integrationService.register(oscIntegration);
    }

    res.send(oscSettings).status(200);
  } catch (error) {
    res.status(400).send({ message: error.toString() });
  }
};

export const postOscSubscriptions = async (req, res) => {
  if (failEmptyObjects(req.body, res)) {
    return;
  }

  try {
    const subscriptions = req.body;
    const oscSettings = DataProvider.getOsc();
    oscSettings.subscriptions = subscriptions;
    await DataProvider.setOsc(oscSettings);

    // TODO: this update could be more granular, checking that relevant data was changed
    const { message } = oscIntegration.init(oscSettings);
    logger.info(LogOrigin.Tx, message);

    res.send(oscSettings).status(200);
  } catch (error) {
    res.status(400).send({ message: error.toString() });
  }
};

// Create controller for GET request to '/ontime/http'
export const getHTTP = async (_req, res: Response<HttpSettings>) => {
  const http = DataProvider.getHttp();
  res.status(200).send(http);
};

// Create controller for POST request to '/ontime/http'
export const postHTTP = async (req, res) => {
  if (failEmptyObjects(req.body, res)) {
    return;
  }

  try {
    const httpSettings = req.body;
    await DataProvider.setHttp(httpSettings);

    integrationService.unregister(httpIntegration);

    // TODO: this update could be more granular, checking that relevant data was changed
    const { success, message } = httpIntegration.init(httpSettings);
    logger.info(LogOrigin.Tx, message);

    if (success) {
      integrationService.register(httpIntegration);
    }

    res.send(httpSettings).status(200);
  } catch (error) {
    res.status(400).send({ message: error.toString() });
  }
};

export async function patchPartialProjectFile(req, res) {
  if (failEmptyObjects(req.body, res)) {
    return;
  }

  try {
    const patchDb: Partial<DatabaseModel> = {
      project: req.body?.project,
      settings: req.body?.settings,
      viewSettings: req.body?.viewSettings,
      osc: req.body?.osc,
      aliases: req.body?.aliases,
      userFields: req.body?.userFields,
      rundown: req.body?.rundown,
    };

    await DataProvider.mergeIntoData(patchDb);
    if (patchDb.rundown !== undefined) {
      // it is likely cheaper to invalidate cache than to calculate diff
      PlaybackService.stop();
      runtimeCacheStore.invalidate(delayedRundownCacheKey);
      notifyChanges({ external: true, reset: true });
    }
    res.status(200).send();
  } catch (error) {
    res.status(400).send({ message: error.toString() });
  }
}

/**
 * uploads, parses and applies the data from a given file
 */
export const dbUpload = async (req, res) => {
  if (!req.file) {
    res.status(400).send({ message: 'File not found' });
    return;
  }
  const options = req.query;
  const file = req.file.path;
  try {
    await parseAndApply(file, req, res, options);
    res.status(200).send();
  } catch (error) {
    res.status(400).send({ message: `Failed parsing ${error}` });
  }
};

/**
 * uploads and parses an excel file
 * @returns parsed result
 */
export async function previewExcel(req, res) {
  if (!req.file) {
    res.status(400).send({ message: 'File not found' });
    return;
  }

  try {
    const options = JSON.parse(req.body.options);
    const file = req.file.path;
    const data = await parseFile(file, req, res, options);
    res.status(200).send(data);
  } catch (error) {
    res.status(500).send({ message: error.toString() });
  }
}

/**
 * Meant to create a new project file, it will clear only fields which are specific to a project
 * @param req
 * @param res
 */
export const postNew: RequestHandler = async (req, res) => {
  try {
    const newProjectData: ProjectData = {
      title: req.body?.title ?? '',
      description: req.body?.description ?? '',
      publicUrl: req.body?.publicUrl ?? '',
      publicInfo: req.body?.publicInfo ?? '',
      backstageUrl: req.body?.backstageUrl ?? '',
      backstageInfo: req.body?.backstageInfo ?? '',
    };
    const newData = await DataProvider.setProjectData(newProjectData);
    await deleteAllEvents();
    res.status(201).send(newData);
  } catch (error) {
    res.status(400).send({ message: error.toString() });
  }
};

//SHEET Functions
/**
 * @description SETP-1 POST Client Secrect
 * @returns parsed result
 */
export async function uploadSheetClientFile(req, res) {
  if (!req.file.path) {
    res.status(400).send({ message: 'File not found' });
    return;
  }
  try {
    const client = JSON.parse(fs.readFileSync(req.file.path as string, 'utf-8'));
    await sheet.saveClientSecrets(client);
    res.status(200).send('OK');
  } catch (error) {
    res.status(500).send({ message: error.toString() });
  }
  fs.unlink(req.file.path, (err) => {
    if (err) logger.error(LogOrigin.Server, err.message);
  });
}

/**
 * @description SETP-1 GET Client Secrect status
 */
export const getClientSecrect = async (req, res) => {
  try {
    const clientSecrectExists = await sheet.testClientSecret();
    if (clientSecrectExists) {
      res.status(200).send();
    } else {
      res.status(500).send({ message: 'The Client ID does not exist' });
    }
  } catch (error) {
    res.status(500).send({ message: error.toString() });
  }
};

/**
 * @description SETP-2 GET sheet authentication url
 */
export async function getAuthenticationUrl(req, res) {
  try {
    const authUrl = await sheet.openAuthServer();
    res.status(200).send(authUrl);
  } catch (error) {
    res.status(500).send({ message: error.toString() });
  }
}

/**
 * @description SETP-2 GET sheet authentication status
 */
export const getAuthentication = async (req, res) => {
  try {
    await sheet.testAuthentication();
    res.status(200).send();
  } catch (error) {
    res.status(500).send({ message: error.toString() });
  }
};

/**
 * @description SETP-3 POST sheet id
 * @returns list of worksheets
 */
export const postId = async (req, res) => {
  try {
    const { id } = req.body;
    if (id.lenght < 40) {
      res.status(400).send({ message: 'ID is usualy 44 characters long' });
    }
    const state = await sheet.testSheetId(id);
    res.status(200).send(state);
  } catch (error) {
    res.status(500).send({ message: error.toString() });
  }
};

/**
 * @description SETP-4 POST worksheet
 */
export const postWorksheet = async (req, res) => {
  try {
    const { worksheet, id } = req.body;
    const state = await sheet.testWorksheet(worksheet, id);
    res.status(200).send(state);
  } catch (error) {
    res.status(500).send({ message: error.toString() });
  }
};

/**
 * @description STEP-5 POST download undown to sheet
 * @returns parsed result
 */
export async function pullSheet(req, res) {
  try {
    const { id, options } = req.body;
    const data = await sheet.pull(id, options);
    res.status(200).send(data);
  } catch (error) {
    res.status(500).send({ message: error.toString() });
  }
}

/**
 * @description STEP-5 POST upload rundown to sheet
 */
export async function pushSheet(req, res) {
  try {
    const { id, options } = req.body;
    await sheet.push(id, options);
    res.status(200).send();
  } catch (error) {
    res.status(500).send({ message: error.toString() });
  }
}
