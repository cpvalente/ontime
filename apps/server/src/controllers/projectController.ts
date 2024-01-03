import { RouteHandlerMethod } from 'fastify';
import { ProjectData } from 'ontime-types';

import { removeUndefined } from '../utils/parserUtils.js';
import { projectSchema } from '../controllers/projectController.schema.js';
import { DataProvider } from '../classes/data-provider/DataProvider.js';
import { Request } from './controller.types.js';

// Create controller for GET request to 'project'
export const getProject: RouteHandlerMethod = async (request, reply) => {
  reply.send(DataProvider.getProjectData());
};

// Create controller for POST request to 'project'
export const postProject: RouteHandlerMethod = async (request: Request<typeof projectSchema>, reply) => {
  try {
    const newEvent: Partial<ProjectData> = removeUndefined({
      title: request.body?.title?.trim(),
      description: request.body?.description?.trim(),
      publicUrl: request.body?.publicUrl?.trim(),
      publicInfo: request.body?.publicInfo?.trim(),
      backstageUrl: request.body?.backstageUrl?.trim(),
      backstageInfo: request.body?.backstageInfo?.trim(),
      endMessage: request.body?.endMessage?.trim(),
    });
    const newData = await DataProvider.setProjectData(newEvent);
    reply.status(200).send(newData);
  } catch (error) {
    reply.status(400).send({ message: error.toString() });
  }
};
