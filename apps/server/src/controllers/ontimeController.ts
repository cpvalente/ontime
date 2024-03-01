import type {
  Alias,
  DatabaseModel,
  GetInfo,
  HttpSettings,
  ProjectData,
  ErrorResponse,
  ProjectFileListResponse,
  OSCSettings,
  RuntimeStore,
  Settings,
  ViewSettings,
} from 'ontime-types';

import { RequestHandler, Request, Response } from 'express';
import fs from 'fs';
import { join } from 'path';

import { DataProvider } from '../classes/data-provider/DataProvider.js';
import { failEmptyObjects, failIsNotArray } from '../utils/routerUtils.js';
import { runtimeService } from '../services/runtime-service/RuntimeService.js';
import { eventStore } from '../stores/EventStore.js';
import { isDocker, resolveDbPath, resolveProjectsDirectory, uploadsFolderPath } from '../setup/index.js';
import { oscIntegration } from '../services/integration-service/OscIntegration.js';
import { httpIntegration } from '../services/integration-service/HttpIntegration.js';
import { setRundown } from '../services/rundown-service/RundownService.js';
import { appStateService } from '../services/app-state-service/AppStateService.js';
import type { OntimeError } from '../utils/backend.types.js';
import { generateUniqueFileName } from '../utils/generateUniqueFilename.js';

import * as projectService from '../services/project-service/ProjectService.js';
import { extractPin } from '../services/project-service/ProjectService.js';
import { handleMaybeExcel } from '../utils/parser.js';
import { ensureJsonExtension } from '../utils/fileManagement.js';

// Create controller for GET request to '/ontime/poll'
// Returns data for current state
export const poll = async (_req: Request, res: Response<Partial<RuntimeStore> | ErrorResponse>) => {
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

// Create controller for GET request to '/ontime/info'
// Returns -
export const getInfo = async (_req: Request, res: Response<GetInfo>) => {
  const info = await projectService.getInfo();
  res.status(200).send(info);
};

// Create controller for GET request to '/ontime/aliases'
// Returns -
export const getAliases = async (_req: Request, res: Response<Alias[]>) => {
  const aliases = DataProvider.getAliases();
  res.status(200).send(aliases);
};

// Create controller for POST request to '/ontime/aliases'
// Returns ACK message
export const postAliases = async (req: Request, res: Response<Alias[] | ErrorResponse>) => {
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

// Create controller for GET request to '/ontime/settings'
// Returns -
export const getSettings = async (_req: Request, res: Response<Settings>) => {
  const settings = DataProvider.getSettings();
  res.status(200).send(settings);
};

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
 */
export const getViewSettings = async (_req: Request, res: Response<ViewSettings>) => {
  const views = DataProvider.getViewSettings();
  res.status(200).send(views);
};

/**
 * @description Change view Settings
 */
export const postViewSettings = async (req: Request, res: Response<ViewSettings | ErrorResponse>) => {
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
export const getOSC = async (_req: Request, res: Response<OSCSettings>) => {
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
  // all fields are optional in validation
  if (failEmptyObjects(req.body, res)) {
    res.status(400).send({ message: 'No field found to patch' });
    return;
  }

  try {
    const patchDb: Partial<DatabaseModel> = {
      project: req.body?.project,
      settings: req.body?.settings,
      viewSettings: req.body?.viewSettings,
      osc: req.body?.osc,
      aliases: req.body?.aliases,
      customFields: req.body?.customFields,
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
export const uploadProjectFile = async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).send({ message: 'File not found' });
    return;
  }

  try {
    const options = req.query;
    const filePath = req.file.path;
    await projectService.applyProjectFile(filePath, options);
    res.status(200).send();
  } catch (error) {
    res.status(400).send({ message: `Failed parsing ${error}` });
  }
};

/**
 * uploads and parses an excel spreadsheet
 * @returns parsed result
 */
export async function previewSpreadsheet(req: Request, res: Response) {
  if (!req.file) {
    res.status(400).send({ message: 'File not found' });
    return;
  }

  try {
    const filePath = req.file.path;
    if (!fs.existsSync(filePath)) {
      throw new Error('Upload failed');
    }

    const options = JSON.parse(req.body.options);
    const data = handleMaybeExcel(filePath, options);
    res.status(200).send(data);
  } catch (error) {
    res.status(500).send({ message: String(error) });
  }
}

/**
 * Retrieves and lists all project files from the uploads directory.
 * @param _req
 * @param res
 */
export const listProjects: RequestHandler = async (_req, res: Response<ProjectFileListResponse | ErrorResponse>) => {
  try {
    const data = await projectService.getProjectList();
    res.status(200).send(data);
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
    const filePath = join(resolveProjectsDirectory, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).send({ message: 'File not found' });
    }
    await projectService.applyProjectFile(filePath);
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

    const errors = projectService.validateProjectFiles({ filename, newFilename });

    if (errors.length) {
      return res.status(409).send({ message: errors.join(', ') });
    }

    await projectService.duplicateProjectFile(filename, newFilename);

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

    const errors = projectService.validateProjectFiles({ filename, newFilename });

    if (errors.length) {
      return res.status(409).send({ message: errors.join(', ') });
    }

    // Rename the file
    await projectService.renameProjectFile(filename, newFilename);

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
    const errors = projectService.validateProjectFiles({ newFilename: filename });

    if (errors.length) {
      return res.status(409).send({ message: 'Project with title already exists' });
    }

    const newProjectData: ProjectData = {
      title: req.body?.title ?? '',
      description: req.body?.description ?? '',
      publicUrl: req.body?.publicUrl ?? '',
      publicInfo: req.body?.publicInfo ?? '',
      backstageUrl: req.body?.backstageUrl ?? '',
      backstageInfo: req.body?.backstageInfo ?? '',
    };

    projectService.createProjectFile(filename, newProjectData);

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

    const { lastLoadedProject } = await appStateService.get();

    if (lastLoadedProject === filename) {
      return res.status(403).send({ message: 'Cannot delete currently loaded project' });
    }

    const errors = projectService.validateProjectFiles({ filename });

    if (errors.length) {
      return res.status(409).send({ message: errors.join(', ') });
    }

    await projectService.deleteProjectFile(filename);

    res.status(200).send({
      message: `Deleted project ${filename}`,
    });
  } catch (error) {
    res.status(500).send({ message: String(error) });
  }
};
