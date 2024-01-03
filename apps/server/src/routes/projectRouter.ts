import Fastify, { FastifyBaseLogger } from 'fastify';
import { Server, IncomingMessage, ServerResponse } from 'http';
import { getProject, postProject } from '../controllers/projectController.js';
import { projectSchema } from '../controllers/projectController.schema.js';
import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts';

export const router = (
  fastify: Fastify.FastifyInstance<Server, IncomingMessage, ServerResponse, FastifyBaseLogger, JsonSchemaToTsProvider>,
  _opts,
  done,
) => {
  // create route between controller and 'GET /project' endpoint
  fastify.get('/', getProject);

  // create route between controller and 'POST /project' endpoint
  fastify.post('/', { schema: projectSchema }, postProject);

  done();
};
