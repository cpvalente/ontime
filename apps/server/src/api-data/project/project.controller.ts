import { ErrorResponse, ProjectData } from 'ontime-types';
import { getErrorMessage } from 'ontime-utils';

import type { Request, Response } from 'express';

import { removeUndefined } from '../../utils/parserUtils.js';
import { failEmptyObjects } from '../../utils/routerUtils.js';
import { getDataProvider } from '../../classes/data-provider/DataProvider.js';
import { handleImageDelete } from '../../services/project-service/projectServiceUtils.js';

export async function getProjectData(_req: Request, res: Response<ProjectData>) {
  res.json(getDataProvider().getProjectData());
}

export async function postProjectData(req: Request, res: Response<ProjectData | ErrorResponse>) {
  if (failEmptyObjects(req.body, res)) {
    return;
  }

  try {
    const newEvent: Partial<ProjectData> = removeUndefined({
      title: req.body?.title,
      description: req.body?.description,
      publicUrl: req.body?.publicUrl,
      publicInfo: req.body?.publicInfo,
      backstageUrl: req.body?.backstageUrl,
      backstageInfo: req.body?.backstageInfo,
      endMessage: req.body?.endMessage,
      projectLogo: req.body?.projectLogo,
    });
    const newData = await getDataProvider().setProjectData(newEvent);
    res.status(200).send(newData);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
}

export async function deleteProjectLogo(_req: Request, res: Response<ProjectData | ErrorResponse>) {
  try {
    const logoFilename = getDataProvider().getProjectData().projectLogo;

    await handleImageDelete(logoFilename);

    const newData = await getDataProvider().setProjectData({ projectLogo: '' });

    res.status(200).send(newData);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
}
