import express from 'express';
import type { Request, Response } from 'express';
import { ProjectLogoResponse, RefetchKey, type ErrorResponse, type ProjectData } from 'ontime-types';
import { getErrorMessage } from 'ontime-utils';

import { projectSanitiser } from './projectData.validation.js';
import { uploadImageFile } from '../db/db.middleware.js';
import * as projectDao from './projectData.dao.js';
import { removeUndefined } from '../../utils/parserUtils.js';
import { sendRefetch } from '../../adapters/WebsocketAdapter.js';
import { handleImageUpload } from '../../services/project-service/projectServiceUtils.js';

export const router = express.Router();

router.get('/', (_req: Request, res: Response<ProjectData>) => {
  res.status(200).json(projectDao.getProjectData());
});

router.post('/', projectSanitiser, async (req: Request, res: Response<ProjectData | ErrorResponse>) => {
  try {
    const newData: Partial<ProjectData> = removeUndefined({
      title: req.body?.title,
      description: req.body?.description,
      url: req.body?.url,
      info: req.body?.info,
      logo: req.body?.logo,
      custom: req.body?.custom,
    });

    const updatedData = await projectDao.editCurrentProjectData(newData);

    res.status(200).send(updatedData);
    sendRefetch(RefetchKey.ProjectData);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});

/**
 * Uploads an image file to be used as a project logo.
 * The image file is saved in the logo directory.
 */
router.post('/upload', uploadImageFile, async (req: Request, res: Response<ProjectLogoResponse | ErrorResponse>) => {
  if (!req.file) {
    res.status(400).send({ message: 'File not found' });
    return;
  }

  try {
    const { filename, path } = req.file;
    const logoFilename = await handleImageUpload(path, filename);
    sendRefetch(RefetchKey.ProjectData);
    res.status(201).send({
      logoFilename,
    });
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(500).send({ message });
  }
});
