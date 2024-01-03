import { getProject, postProject } from '../controllers/projectController.js';
import { projectSchema } from '../controllers/projectController.schema.js';
import { FastifyRouter } from './router.types.js';

export const router = (fastify: FastifyRouter, _opts, done) => {
  // create route between controller and 'GET /project' endpoint
  fastify.get('/', getProject);

  // create route between controller and 'POST /project' endpoint
  fastify.post('/', { schema: projectSchema }, postProject);

  done();
};
