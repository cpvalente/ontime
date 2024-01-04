import { ProjectData, ProjectDataSchema, ErrorResponse } from 'ontime-types';
import { DataProvider } from '../classes/data-provider/DataProvider.js';
import { ZodFastifyRouter } from './router.types.js';

export const router = (fastify: ZodFastifyRouter, _opts, done) => {
  // create route between controller and 'GET /project' endpoint
  fastify.get('/', (req, res) => {
    res.send(DataProvider.getProjectData());
  });

  // create route between controller and 'POST /project' endpoint
  fastify.post<{
    Body: Partial<ProjectData>;
    Reply: {
      200: ProjectData;
      400: ErrorResponse;
    };
  }>('/', { schema: { body: ProjectDataSchema.partial() } }, async (req, res) => {
    try {
      const newProjectData = req.body;
      const savedProjectData = await DataProvider.setProjectData(newProjectData);
      res.status(200).send(savedProjectData);
    } catch (error) {
      res.status(400).send({ message: error.toString() });
    }
  });

  done();
};
