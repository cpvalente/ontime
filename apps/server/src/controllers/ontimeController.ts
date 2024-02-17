import { LogOrigin } from 'ontime-types';
import type {
  Alias,
  DatabaseModel,
  GetInfo,
  HttpSettings,
  ProjectData,
  ErrorResponse,
  ProjectFileListResponse,
  OSCSettings,
} from 'ontime-types';
import { ExcelImportOptions, deepmerge } from 'ontime-utils';

import { RequestHandler, Request, Response } from 'express';
import fs from 'fs';
import { networkInterfaces } from 'os';
import { join } from 'path';
import { copyFile, rename, writeFile } from 'fs/promises';

import { fileHandler } from '../utils/parser.js';
import { DataProvider } from '../classes/data-provider/DataProvider.js';
import { failEmptyObjects, failIsNotArray } from '../utils/routerUtils.js';
import { runtimeService } from '../services/runtime-service/RuntimeService.js';
import { eventStore } from '../stores/EventStore.js';
import {
  getAppDataPath,
  isDocker,
  lastLoadedProjectConfigPath,
  resolveDbPath,
  resolveStylesPath,
  uploadsFolderPath,
} from '../setup.js';
import { oscIntegration } from '../services/integration-service/OscIntegration.js';
import { httpIntegration } from '../services/integration-service/HttpIntegration.js';
import { logger } from '../classes/Logger.js';
import { notifyChanges, setRundown } from '../services/rundown-service/RundownService.js';
import { getProjectFiles } from '../utils/getFileListFromFolder.js';
import { configService } from '../services/ConfigService.js';
import { deleteFile } from '../utils/parserUtils.js';
import { validateProjectFiles } from './ontimeController.validate.js';
import { dbModel } from '../models/dataModel.js';
import { sheet } from '../utils/sheetsAuth.js';
import { removeFileExtension } from '../utils/removeFileExtension.js';
import type { OntimeError } from '../utils/backend.types.js';
import { ensureJsonExtension } from '../utils/ensureJsonExtension.js';
import { generateUniqueFileName } from '../utils/generateUniqueFilename.js';

// Create controller for GET request to '/ontime/poll'
// Returns data for current state
export const poll = async (_req: Request, res: Response) => {
  try {
    const state = eventStore.poll();
    res.status(200).send(state);
  } catch (error) {
    res.status(500).send({
      message: `Could not get sync data: ${error}`,
    });
  }
};

// Create controller for GET request to '/ontime/db'
// Returns -
export const dbDownload = async (_req: Request, res: Response) => {
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
async function parseFile(file, _req: Request, _res: Response, options: ExcelImportOptions) {
  if (!fs.existsSync(file)) {
    throw new Error('Upload failed');
  }
  const result = await fileHandler(file, options);
  return result.data;
}

export type ParsingOptions = {
  onlyRundown?: 'true' | 'false';
};

/**
 * parse an uploaded file and apply its parsed objects
 * @param file
 * @param req
 * @param res
 * @param [options]
 * @returns {Promise<void>}
 */
const parseAndApply = async (file, _req: Request, res: Response, options) => {
  const result = await parseFile(file, _req, res, options);

  runtimeService.stop();

  const newRundown = result.rundown || [];
  const { rundown, ...rest } = result;
  if (options?.onlyRundown === 'true') {
    setRundown(newRundown ?? []);
  } else {
    await DataProvider.mergeIntoData(rest);
    setRundown(rundown ?? []);
  }
  notifyChanges({ timer: true, external: true });
};

/**
 * @description Gets information on IPV4 non-internal interfaces
 * @returns {array} - Array of objects {name: ip}
 */
const getNetworkInterfaces = () => {
  const nets = networkInterfaces();
  const results: { name: string; address: string }[] = [];

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (net.family === 'IPv4' && !net.internal) {
        results.push({
          name,
          address: net.address,
        });
      }
    }
  }

  return results;
};

// Create controller for GET request to '/ontime/info'
// Returns -
export const getInfo = async (_req: Request, res: Response<GetInfo>) => {
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
export const getAliases = async (_req: Request, res: Response) => {
  const aliases = DataProvider.getAliases();
  res.status(200).send(aliases);
};

// Create controller for POST request to '/ontime/aliases'
// Returns ACK message
export const postAliases = async (req: Request, res: Response) => {
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
    res.status(400).send({ message: String(error) });
  }
};

// Create controller for GET request to '/ontime/userfields'
// Returns -
export const getUserFields = async (_req: Request, res: Response) => {
  const userFields = DataProvider.getUserFields();
  res.status(200).send(userFields);
};

// Create controller for POST request to '/ontime/userfields'
// Returns ACK message
export const postUserFields = async (req: Request, res: Response) => {
  if (failEmptyObjects(req.body, res)) {
    return;
  }
  try {
    const persistedData = DataProvider.getUserFields();
    const newData = deepmerge(persistedData, req.body);
    await DataProvider.setUserFields(newData);
    res.status(200).send(newData);
  } catch (error) {
    res.status(400).send({ message: String(error) });
  }
};

// Create controller for POST request to '/ontime/settings'
// Returns -
export const getSettings = async (_req: Request, res: Response) => {
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
export const postSettings = async (req: Request, res: Response) => {
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
    res.status(400).send({ message: String(error) });
  }
};

/**
 * @description Get view Settings
 * @method GET
 */
export const getViewSettings = async (_req: Request, res: Response) => {
  const views = DataProvider.getViewSettings();
  res.status(200).send(views);
};

/**
 * @description Change view Settings
 * @method POST
 */
export const postViewSettings = async (req: Request, res: Response) => {
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
    res.status(400).send({ message: String(error) });
  }
};

// Create controller for GET request to '/ontime/osc'
// Returns -
export const getOSC = async (_req: Request, res: Response) => {
  const osc = DataProvider.getOsc();
  res.status(200).send(osc);
};

// Create controller for POST request to '/ontime/osc'
// Returns ACK message
export const postOSC = async (req: Request, res: Response<OSCSettings | OntimeError>) => {
  if (failEmptyObjects(req.body, res)) {
    return;
  }

  try {
    const oscSettings = req.body;

    oscIntegration.init(oscSettings);
    // we persist the data after init to avoid persisting invalid data
    const result = await DataProvider.setOsc(oscSettings);
    res.send(result).status(200);
  } catch (error) {
    res.status(400).send({ message: String(error) });
  }
};

// Create controller for GET request to '/ontime/http'
export const getHTTP = async (_req: Request, res: Response<HttpSettings>) => {
  const http = DataProvider.getHttp();
  res.status(200).send(http);
};

// Create controller for POST request to '/ontime/http'
export const postHTTP = async (req: Request, res: Response<HttpSettings | OntimeError>) => {
  if (failEmptyObjects(req.body, res)) {
    return;
  }

  try {
    const httpSettings = req.body;

    httpIntegration.init(httpSettings);
    // we persist the data after init to avoid persisting invalid data
    const result = await DataProvider.setHttp(httpSettings);
    res.send(result).status(200);
  } catch (error) {
    res.status(400).send({ message: String(error) });
  }
};

export async function patchPartialProjectFile(req: Request, res: Response) {
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
    };

    const maybeRundown = req.body?.rundown;
    await DataProvider.mergeIntoData(patchDb);
    if (maybeRundown !== undefined) {
      // it is likely cheaper to invalidate cache than to calculate diff
      runtimeService.stop();
      await setRundown(maybeRundown);
    }
    res.status(200).send();
  } catch (error) {
    res.status(400).send({ message: String(error) });
  }
}

/**
 * uploads, parses and applies the data from a given file
 */
export const dbUpload = async (req: Request, res: Response) => {
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
export async function previewExcel(req, res: Response) {
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
    res.status(500).send({ message: String(error) });
  }
}

/**
 * Retrieves and lists all project files from the uploads directory.
 * @param req
 * @param res
 */
export const listProjects: RequestHandler = async (_, res: Response<ProjectFileListResponse | ErrorResponse>) => {
  try {
    const fileList = await getProjectFiles();

    const lastLoadedProject = JSON.parse(fs.readFileSync(lastLoadedProjectConfigPath, 'utf8')).lastLoadedProject;

    const lastLoadedProjectName = removeFileExtension(lastLoadedProject);

    res.status(200).send({
      files: fileList,
      lastLoadedProject: lastLoadedProjectName,
    });
  } catch (error) {
    res.status(500).send({ message: String(error) });
  }
};

/**
 * Receives a `filename` from the request body and loads the project file from the uploads directory.
 * @param req
 * @param res
 */
export const loadProject: RequestHandler = async (req, res) => {
  try {
    const filename = req.body.filename;

    const uploadsFolderPath = join(getAppDataPath(), 'uploads');
    const filePath = join(uploadsFolderPath, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).send({ message: 'File not found' });
    }

    await parseAndApply(filePath, req, res, {});

    res.status(200).send({
      message: `Loaded project ${filename}`,
    });
  } catch (error) {
    res.status(500).send({ message: String(error) });
  }
};

/**
 * Duplicates a project file.
 * Receives the original project filename (`filename`) from the request parameters
 * and the filename for the duplicate (`newFilename`) from the request body.
 *
 * @param {Request} req - The express request object. Expects `filename` in the request parameters and `newFilename` in the request body.
 * @param {Response} res - The express response object. Sends a 200 status with a success message upon successful duplication,
 *                         a 409 status if there are validation errors,
 *                         or a 500 status with an error message in case of an exception.
 */
export const duplicateProjectFile: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const { newFilename } = req.body;

    const projectFilePath = join(uploadsFolderPath, filename);
    const duplicateProjectFilePath = join(uploadsFolderPath, newFilename);

    const errors = validateProjectFiles({ filename, newFilename });

    if (errors.length) {
      return res.status(409).send({ message: errors.join(', ') });
    }

    await copyFile(projectFilePath, duplicateProjectFilePath);

    res.status(200).send({
      message: `Duplicated project ${filename} to ${newFilename}`,
    });
  } catch (error) {
    res.status(500).send({ message: String(error) });
  }
};

/**
 * Renames a project file.
 * Receives the current filename (`filename`) from the request parameters
 * and the new filename (`newFilename`) from the request body.
 *
 * @param {Request} req - The express request object. Expects `filename` in the request parameters and `newFilename` in the request body.
 * @param {Response} res - The express response object. Sends a 200 status with a success message upon successful renaming,
 *                         a 409 status if there are validation errors,
 *                         or a 500 status with an error message in case of an exception.
 */
export const renameProjectFile: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { newFilename } = req.body;
    const { filename } = req.params;

    const projectFilePath = join(uploadsFolderPath, filename);
    const newProjectFilePath = join(uploadsFolderPath, newFilename);

    const errors = validateProjectFiles({ filename, newFilename });

    if (errors.length) {
      return res.status(409).send({ message: errors.join(', ') });
    }

    // Rename the file
    await rename(projectFilePath, newProjectFilePath);

    // Update the last loaded project config if current loaded project is the one being renamed
    const { lastLoadedProject } = await configService.getConfig();

    if (lastLoadedProject === filename) {
      await configService.updateDatabaseConfig(newFilename);
    }

    res.status(200).send({
      message: `Renamed project ${filename} to ${newFilename}`,
    });
  } catch (error) {
    res.status(500).send({ message: String(error) });
  }
};

/**
 * Creates a new project file.
 * Receives the project filename (`filename`) from the request body.
 *
 * @param {Request} req - The express request object. Expects `filename` in the request body.
 * @param {Response} res - The express response object. Sends a 200 status with a success message upon successful creation,
 *                         a 409 status if there are validation errors,
 *                         or a 500 status with an error message in case of an exception.
 */
export const createProjectFile: RequestHandler = async (req: Request, res: Response) => {
  try {
    const originalFilename = ensureJsonExtension(req.body.title || 'Untitled');
    const filename = generateUniqueFileName(uploadsFolderPath, originalFilename);

    const projectFilePath = join(uploadsFolderPath, filename);

    const errors = validateProjectFiles({ newFilename: filename });

    const newProjectData: ProjectData = {
      title: req.body?.title ?? '',
      description: req.body?.description ?? '',
      publicUrl: req.body?.publicUrl ?? '',
      publicInfo: req.body?.publicInfo ?? '',
      backstageUrl: req.body?.backstageUrl ?? '',
      backstageInfo: req.body?.backstageInfo ?? '',
    };

    const data = {
      ...dbModel,
      project: {
        ...dbModel.project,
        ...newProjectData,
      },
    };

    if (errors.length) {
      return res.status(409).send({ message: 'Project with title already exists' });
    }

    await writeFile(projectFilePath, JSON.stringify(data));
    await parseAndApply(projectFilePath, req, res, {});

    res.status(200).send({
      filename,
    });
  } catch (error) {
    res.status(500).send({ message: String(error) });
  }
};

/**
 * Deletes an existing project file.
 * Receives the project filename (`filename`) from the request parameters.
 *
 * @param {Request} req - The express request object. Expects `filename` in the request parameters.
 * @param {Response} res - The express response object. Sends a 200 status with a success message upon successful deletion,
 *                         a 403 status if attempting to delete the currently loaded project,
 *                         a 409 status if there are validation errors,
 *                         or a 500 status with an error message in case of an exception.
 */
export const deleteProjectFile: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;

    const { lastLoadedProject } = await configService.getConfig();

    if (lastLoadedProject === filename) {
      return res.status(403).send({ message: 'Cannot delete currently loaded project' });
    }

    const projectFilePath = join(uploadsFolderPath, filename);

    const errors = validateProjectFiles({ filename });

    if (errors.length) {
      return res.status(409).send({ message: errors.join(', ') });
    }

    await deleteFile(projectFilePath);

    res.status(200).send({
      message: `Deleted project ${filename}`,
    });
  } catch (error) {
    res.status(500).send({ message: String(error) });
  }
};

// SHEET Functions
/**
 * @description SETP-1 POST Client Secrect
 * @returns parsed result
 */
export async function uploadSheetClientFile(req, res: Response) {
  if (!req.file.path) {
    res.status(400).send({ message: 'File not found' });
    return;
  }
  try {
    const client = JSON.parse(fs.readFileSync(req.file.path as string, 'utf-8'));
    await sheet.saveClientSecrets(client);
    res.status(200).send('OK');
  } catch (error) {
    res.status(500).send({ message: String(error) });
  }
  fs.unlink(req.file.path, (err) => {
    if (err) logger.error(LogOrigin.Server, err.message);
  });
}

/**
 * @description STEP-1 GET Client Secret status
 */
export const getClientSecret = async (req: Request, res: Response) => {
  try {
    // TODO: can we merge this with the previous?
    const clientSecretExists = await sheet.testClientSecret();
    if (clientSecretExists) {
      res.status(200).send();
    } else {
      res.status(500).send({ message: 'The Client ID does not exist' });
    }
  } catch (error) {
    res.status(500).send({ message: String(error) });
  }
};

/**
 * @description STEP-2 GET sheet authentication url
 */
export async function getAuthenticationUrl(_req: Request, res: Response) {
  try {
    const authUrl = await sheet.openAuthServer();
    res.status(200).send(authUrl);
  } catch (error) {
    res.status(500).send({ message: String(error) });
  }
}

/**
 * @description STEP-2 GET sheet authentication status
 */
export const getAuthentication = async (_req: Request, res: Response) => {
  try {
    await sheet.testAuthentication();
    res.status(200).send();
  } catch (error) {
    res.status(500).send({ message: String(error) });
  }
};

/**
 * @description STEP-3 POST sheet id
 * @returns list of worksheets
 */
export const postId = async (req: Request, res: Response) => {
  try {
    const { sheetId } = req.body;
    if (sheetId.length < 40) {
      res.status(400).send({ message: 'ID is usually 44 characters long' });
    }
    const state = await sheet.testSheetId(sheetId);
    res.status(200).send(state);
  } catch (error) {
    res.status(500).send({ message: String(error) });
  }
};

/**
 * @description STEP-4 POST worksheet
 */
export const postWorksheet = async (req: Request, res: Response) => {
  try {
    const { sheetId, worksheet } = req.body;
    const state = await sheet.testWorksheet(sheetId, worksheet);
    res.status(200).send(state);
  } catch (error) {
    res.status(500).send({ message: String(error) });
  }
};

/**
 * @description STEP-5 POST download rundown to sheet
 * @returns parsed result
 */
export async function pullSheet(req: Request, res: Response) {
  try {
    const { sheetId, options } = req.body;
    console.log('starting');
    const data = await sheet.pull(sheetId, options);
    console.log('finished');
    res.status(200).send(data);
  } catch (error) {
    res.status(500).send({ message: String(error) });
  }
}

/**
 * @description STEP-5 POST upload rundown to sheet
 */
export async function pushSheet(req: Request, res: Response) {
  try {
    const { sheetId, options } = req.body;
    await sheet.push(sheetId, options);
    res.status(200).send();
  } catch (error) {
    res.status(500).send({ message: String(error) });
  }
}
