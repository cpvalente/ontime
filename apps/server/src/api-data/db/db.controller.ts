import {
  DatabaseModel,
  ErrorResponse,
  GetInfo,
  MessageResponse,
  ProjectData,
  ProjectFileListResponse,
} from 'ontime-types';
import { getErrorMessage } from 'ontime-utils';

import type { Request, Response } from 'express';

import { doesProjectExist, handleUploaded } from '../../services/project-service/projectServiceUtils.js';
import * as projectService from '../../services/project-service/ProjectService.js';

export async function patchPartialProjectFile(req: Request, res: Response<DatabaseModel | ErrorResponse>) {
  try {
    const { rundown, project, settings, viewSettings, urlPresets, customFields, osc, http } = req.body;
    const patchDb: DatabaseModel = { rundown, project, settings, viewSettings, urlPresets, customFields, osc, http };

    const newData = await projectService.patchCurrentProject(patchDb);

    res.status(200).send(newData);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
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
  const newProjectData: ProjectData = {
    title: req.body?.title ?? '',
    description: req.body?.description ?? '',
    publicUrl: req.body?.publicUrl ?? '',
    publicInfo: req.body?.publicInfo ?? '',
    backstageUrl: req.body?.backstageUrl ?? '',
    backstageInfo: req.body?.backstageInfo ?? '',
  };

  try {
    const newFileName = await projectService.createProject(req.body.filename, newProjectData);

    res.status(200).send({
      filename: newFileName,
    });
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(500).send({ message });
  }
}

/**
 * Allows downloading of project files
 */
export async function projectDownload(req: Request, res: Response) {
  const { filename } = req.body;
  const pathToFile = await doesProjectExist(filename);
  if (!pathToFile) {
    return res.status(404).send({ message: `Project ${filename} not found.` });
  }

  res.download(pathToFile, filename, (error) => {
    if (error) {
      const message = getErrorMessage(error);
      res.status(500).send({ message });
    }
  });
}

/**
 * uploads, parses and applies the data from a given file
 * Pretty much loadProject but with the extra upload step
 */
export async function postProjectFile(req: Request, res: Response<MessageResponse | ErrorResponse>) {
  if (!req.file) {
    res.status(400).send({ message: 'File not found' });
    return;
  }

  try {
    const { filename, path } = req.file;
    await handleUploaded(path, filename);
    await projectService.loadProjectFile(filename);

    res.status(201).send({
      message: `Loaded project ${filename}`,
    });
  } catch (error) {
    const message = getErrorMessage(error);
    if (message.startsWith('Project file')) {
      return res.status(403).send({ message });
    }
    res.status(400).send({ message });
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
    const message = getErrorMessage(error);
    res.status(500).send({ message });
  }
}

/**
 * Receives a `filename` from the request body and loads the project file from the uploads directory.
 */
export async function loadProject(req: Request, res: Response<MessageResponse | ErrorResponse>) {
  try {
    const name = req.body.filename;
    await projectService.loadProjectFile(name);

    res.status(201).send({
      message: `Loaded project ${name}`,
    });
  } catch (error) {
    const message = getErrorMessage(error);
    if (message.startsWith('Project file')) {
      return res.status(403).send({ message });
    }
    res.status(500).send({ message });
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
  // file to copy from
  const { filename } = req.params;
  // new file name
  const { newFilename } = req.body;

  try {
    await projectService.duplicateProjectFile(filename, newFilename);

    res.status(201).send({
      message: `Duplicated project ${filename} to ${newFilename}`,
    });
  } catch (error) {
    const message = getErrorMessage(error);
    if (message.startsWith('Project file')) {
      return res.status(403).send({ message });
    }

    res.status(500).send({ message });
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

    await projectService.renameProjectFile(filename, newFilename);

    res.status(201).send({
      message: `Renamed project ${filename} to ${newFilename}`,
    });
  } catch (error) {
    const message = getErrorMessage(error);
    if (message.startsWith('Project file')) {
      return res.status(403).send({ message });
    }

    res.status(500).send({ message });
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
  const { filename } = req.params;
  try {
    await projectService.deleteProjectFile(filename);

    res.status(200).send({
      message: `Deleted project ${filename}`,
    });
  } catch (error) {
    const message = getErrorMessage(error);
    if (message === 'Cannot delete currently loaded project') {
      return res.status(403).send({ message });
    }
    if (message === 'Project file not found') {
      return res.status(404).send({ message });
    }

    res.status(500).send({ message });
  }
}

export async function getInfo(_req: Request, res: Response<GetInfo | ErrorResponse>) {
  try {
    const info = await projectService.getInfo();
    res.status(200).send(info);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(500).send({ message });
  }
}
