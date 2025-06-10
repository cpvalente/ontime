import { ErrorResponse, ProjectData } from 'ontime-types';
import { getErrorMessage } from 'ontime-utils';

import type { Request, Response } from 'express';

import { removeUndefined } from '../../utils/parserUtils.js';
import { failEmptyObjects } from '../../utils/routerUtils.js';
import { editCurrentProjectData } from '../../services/project-service/ProjectService.js';
import * as projectDao from './projectData.dao.js';

export function getProjectData(_req: Request, res: Response<ProjectData>) {
  res.status(200).json(projectDao.getProjectData());
}

export async function postProjectData(req: Request, res: Response<ProjectData | ErrorResponse>) {
  try {
    const newData: Partial<ProjectData> = removeUndefined({
      title: req.body?.title,
      description: req.body?.description,
      publicUrl: req.body?.publicUrl,
      publicInfo: req.body?.publicInfo,
      backstageUrl: req.body?.backstageUrl,
      backstageInfo: req.body?.backstageInfo,
      endMessage: req.body?.endMessage,
      projectLogo: req.body?.projectLogo,
      custom: req.body?.custom,
    });

    const updatedData = await editCurrentProjectData(newData);

    res.status(200).send(updatedData);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
}
