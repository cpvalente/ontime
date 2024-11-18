import { ErrorResponse, ProjectData } from 'ontime-types';
import { getErrorMessage } from 'ontime-utils';

import type { Request, Response } from 'express';
import { join } from 'path';

import { deleteFile, removeUndefined } from '../../utils/parserUtils.js';
import { failEmptyObjects } from '../../utils/routerUtils.js';
import { getDataProvider } from '../../classes/data-provider/DataProvider.js';
import { publicDir } from '../../setup/index.js';

export function getProjectData(_req: Request, res: Response<ProjectData>) {
  res.json(getDataProvider().getProjectData());
}

export async function postProjectData(req: Request, res: Response<ProjectData | ErrorResponse>) {
  if (failEmptyObjects(req.body, res)) {
    return;
  }

  try {
    const currentProjectData = getDataProvider().getProjectData();

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

    // Delete the old logo if the new logo is empty
    if (!newData.projectLogo && currentProjectData.projectLogo) {
      const filePath = join(publicDir.logoDir, currentProjectData.projectLogo);

      deleteFile(filePath).catch((_error) => {
        /** we do not handle this error */
      });
    }

    res.status(200).send(newData);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
}
