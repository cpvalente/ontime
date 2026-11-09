import express from 'express';
import type { Request, Response, Router } from 'express';
import type { ProjectData } from 'ontime-types';

import { removeUndefined } from '../../utils/parserUtils.js';
import { postProjectLogo } from '../db/db.controller.js';
import { uploadImageFile } from '../db/db.middleware.js';
import * as projectDao from './projectData.dao.js';
import { projectSanitiser } from './projectData.validation.js';

export const router: Router = express.Router();

router.get('/', (_req: Request, res: Response<ProjectData>) => {
  res.status(200).json(projectDao.getProjectData());
});

router.post('/', projectSanitiser, async (req: Request, res: Response<ProjectData>) => {
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
});

router.post('/upload', uploadImageFile, postProjectLogo);
