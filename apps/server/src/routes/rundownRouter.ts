import Fastify, { FastifyBaseLogger } from 'fastify';
import { Server, IncomingMessage, ServerResponse } from 'http';
import {
  deleteEventById,
  rundownApplyDelay,
  rundownDelete,
  rundownGetAll,
  rundownGetCached,
  rundownPost,
  rundownPut,
  rundownReorder,
  rundownSwap,
} from '../controllers/rundownController.js';
import {
  rundownPostSchema,
  rundownPutSchema,
  paramsMustHaveEventIdSchema,
  rundownReorderSchema,
} from '../controllers/rundownController.schema.js';
import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts';

export const router = (
  fastify: Fastify.FastifyInstance<Server, IncomingMessage, ServerResponse, FastifyBaseLogger, JsonSchemaToTsProvider>,
  _opts,
  done,
) => {
  // create route between controller and '/events/cached' endpoint
  fastify.get('/cached', rundownGetCached);

  // create route between controller and '/events/' endpoint
  fastify.get('/', rundownGetAll);

  // create route between controller and '/events/' endpoint
  fastify.post('/', { schema: rundownPostSchema }, rundownPost);
  // create route between controller and '/events/' endpoint
  fastify.put('/', { schema: rundownPutSchema }, rundownPut);

  // create route between controller and '/events/reorder' endpoint
  fastify.patch('/reorder', { schema: rundownReorderSchema }, rundownReorder);

  fastify.patch('/swap', { schema: paramsMustHaveEventIdSchema }, rundownSwap);

  // create route between controller and '/events/applydelay/:eventId' endpoint
  fastify.patch('/applydelay/:eventId', { schema: paramsMustHaveEventIdSchema }, rundownApplyDelay);

  // create route between controller and '/events/all' endpoint
  fastify.delete('/all', rundownDelete);

  // create route between controller and '/events/:eventId' endpoint
  fastify.delete('/:eventId', { schema: paramsMustHaveEventIdSchema }, deleteEventById);

  done();
};
