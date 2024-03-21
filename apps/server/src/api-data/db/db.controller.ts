import {
  DatabaseModel,
  ErrorResponse,
  GetInfo,
  MessageResponse,
  ProjectData,
  ProjectFileListResponse,
} from 'ontime-types';

import type { Request, Response } from 'express';
import fs from 'fs';
import { join } from 'path';

import { DataProvider } from '../../classes/data-provider/DataProvider.js';
import { failEmptyObjects } from '../../utils/routerUtils.js';
import { resolveDbPath, resolveProjectsDirectory } from '../../setup/index.js';

import * as projectService from '../../services/project-service/ProjectService.js';
import { runtimeService } from '../../services/runtime-service/RuntimeService.js';
import { setRundown } from '../../services/rundown-service/RundownService.js';
import { ensureJsonExtension } from '../../utils/fileManagement.js';
import { generateUniqueFileName } from '../../utils/generateUniqueFilename.js';
import { appStateService } from '../../services/app-state-service/AppStateService.js';
import { handleMaybeExcel } from '../../utils/parser.js';

export async function patchPartialProjectFile(req: Request, res: Response<DatabaseModel | ErrorResponse>) {
  // all fields are optional in validation
  if (failEmptyObjects(req.body, res)) {
    res.status(400).send({ message: 'No field found to patch' });
    return;
  }

  try {
    const { rundown, project, settings, viewSettings, urlPresets, customFields, osc, http } = req.body;
    const patchDb: DatabaseModel = { rundown, project, settings, viewSettings, urlPresets, customFields, osc, http };

    res.status(200).send(newData);
  } catch (error) {
    res.status(400).send({ message: String(error) });
  }
}

/**
 * Creates a new project file.
 * Receives the project filename (`filename`) from the request body.
 *
 * @param {Request} req - The express request object. Expects `filename` in the request body.
 * @param {Response} res - The express response object. Sends a 200 status with a success message upon successful creation,
 *                         a 409 status if there are validation errors,
 *                         or a 500 status with an error message in case of an exception.
 */
export async function createProjectFile(req: Request, res: Response<{ filename: string } | ErrorResponse>) {
  try {
    const originalFilename = ensureJsonExtension(req.body.title || 'Untitled');
    const filename = generateUniqueFileName(resolveProjectsDirectory, originalFilename);
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
}

export async function projectDownload(_req: Request, res: Response) {
  const fileTitle = projectService.getProjectTitle();
  res.download(resolveDbPath, `${fileTitle}.json`, (err) => {
    if (err) {
      res.status(500).send({
        message: `Could not download the file: ${err}`,
      });
    }
  });
}

/**
 * uploads, parses and applies the data from a given file
 */
export async function postProjectFile(req: Request, res: Response<MessageResponse | ErrorResponse>) {
  if (!req.file) {
    res.status(400).send({ message: 'File not found' });
    return;
  }

  try {
    const options = req.query;
    const filePath = req.file.path;
    await projectService.applyProjectFile(filePath, options);
    res.status(201).send({ message: 'ok' });
  } catch (error) {
    res.status(400).send({ message: `Failed parsing ${error}` });
  }
}

/**
 * Retrieves and lists all project files from the uploads directory.
 */
export async function listProjects(_req: Request, res: Response<ProjectFileListResponse | ErrorResponse>) {
  try {
    const data = await projectService.getProjectList();
    res.status(200).send(data);
  } catch (error) {
    res.status(500).send({ message: String(error) });
  }
}

/**
 * Receives a `filename` from the request body and loads the project file from the uploads directory.
 */
export async function loadProject(req: Request, res: Response<MessageResponse | ErrorResponse>) {
  try {
    const name = req.body.filename;
    if (!projectService.doesProjectExist(name)) {
      return res.status(404).send({ message: 'File not found' });
    }
    await projectService.applyProjectFile(filePath);
    res.status(201).send({
      message: `Loaded project ${filename}`,
    });
  } catch (error) {
    res.status(500).send({ message: String(error) });
  }
}

/**
 * Duplicates a project file.
 * Receives the original project filename (`filename`) from the request parameters
 * and the filename for the duplicate (`newFilename`) from the request body.
 *
 * @param {Request} req - The express request object. Expects `filename` in the request parameters and `newFilename` in the request body.
 * @param {Response} res - The express response object. Sends a 201 status with a success message upon successful duplication,
 *                         a 409 status if there are validation errors,
 *                         or a 500 status with an error message in case of an exception.
 */
export async function duplicateProjectFile(req: Request, res: Response<MessageResponse | ErrorResponse>) {
  try {
    const { filename } = req.params;
    const { newFilename } = req.body;

    const errors = projectService.validateProjectFiles({ filename, newFilename });

    if (errors.length) {
      return res.status(409).send({ message: errors.join(', ') });
    }

    await projectService.duplicateProjectFile(filename, newFilename);

    res.status(201).send({
      message: `Duplicated project ${filename} to ${newFilename}`,
    });
  } catch (error) {
    res.status(500).send({ message: String(error) });
  }
}

/**
 * Renames a project file.
 * Receives the current filename (`filename`) from the request parameters
 * and the new filename (`newFilename`) from the request body.
 *
 * @param {Request} req - The express request object. Expects `filename` in the request parameters and `newFilename` in the request body.
 * @param {Response} res - The express response object. Sends a 201 status with a success message upon successful renaming,
 *                         a 409 status if there are validation errors,
 *                         or a 500 status with an error message in case of an exception.
 */
export async function renameProjectFile(req: Request, res: Response<MessageResponse | ErrorResponse>) {
  try {
    const { newFilename } = req.body;
    const { filename } = req.params;

    const errors = projectService.validateProjectFiles({ filename, newFilename });

    if (errors.length) {
      return res.status(409).send({ message: errors.join(', ') });
    }

    // Rename the file
    await projectService.renameProjectFile(filename, newFilename);

    res.status(201).send({
      message: `Renamed project ${filename} to ${newFilename}`,
    });
  } catch (error) {
    res.status(500).send({ message: String(error) });
  }
}

/**
 * Deletes an existing project file.
 * Receives the project filename (`filename`) from the request parameters.
 *
 * @param {Request} req - The express request object. Expects `filename` in the request parameters.
 * @param {Response} res - The express response object. Sends a 204 status with a success message upon successful deletion,
 *                         a 403 status if attempting to delete the currently loaded project,
 *                         a 409 status if there are validation errors,
 *                         or a 500 status with an error message in case of an exception.
 */
export async function deleteProjectFile(req: Request, res: Response<MessageResponse | ErrorResponse>) {
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

    res.status(204).send({
      message: `Deleted project ${filename}`,
    });
  } catch (error) {
    res.status(500).send({ message: String(error) });
  }
}

export async function getInfo(_req: Request, res: Response<GetInfo>) {
  const info = await projectService.getInfo();
  res.status(200).send(info);
}

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
    const { data } = handleMaybeExcel(filePath, options);
    res.status(200).send(data);
  } catch (error) {
    res.status(500).send({ message: String(error) });
  }
}
