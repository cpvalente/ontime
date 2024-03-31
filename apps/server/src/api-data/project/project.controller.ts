import { ErrorResponse, ProjectData } from 'ontime-types';

import type { Request, Response } from 'express';
import { DataProvider } from '../../classes/data-provider/DataProvider.js';
import { removeUndefined } from '../../utils/parserUtils.js';
import { failEmptyObjects } from '../../utils/routerUtils.js';

export async function getProjectData(_req: Request, res: Response<ProjectData>) {
  res.json(DataProvider.getProjectData());
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
    });
    const newData = await DataProvider.setProjectData(newEvent);
    res.status(200).send(newData);
  } catch (error) {
    res.status(400).send({ message: error.toString() });
  }
}
