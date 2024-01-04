import { RouteHandlerMethod } from 'fastify';
import { ProjectData } from 'ontime-types';

import { removeUndefined } from '../utils/parserUtils.js';
import { projectSchema } from '../controllers/projectController.schema.js';
import { DataProvider } from '../classes/data-provider/DataProvider.js';
import { Request } from './controller.types.js';

// Create controller for GET request to 'project'
export const getProject: RouteHandlerMethod = async (req, res) => {
  res.send(DataProvider.getProjectData());
};

// Create controller for POST request to 'project'
export const postProject: RouteHandlerMethod = async (req: Request<typeof projectSchema>, res) => {
  try {
    const newEvent: Partial<ProjectData> = removeUndefined({
      title: req.body?.title?.trim(),
      description: req.body?.description?.trim(),
      publicUrl: req.body?.publicUrl?.trim(),
      publicInfo: req.body?.publicInfo?.trim(),
      backstageUrl: req.body?.backstageUrl?.trim(),
      backstageInfo: req.body?.backstageInfo?.trim(),
      endMessage: req.body?.endMessage?.trim(),
    });
    const newData = await DataProvider.setProjectData(newEvent);
    res.status(200).send(newData);
  } catch (error) {
    res.status(400).send({ message: error.toString() });
  }
};
