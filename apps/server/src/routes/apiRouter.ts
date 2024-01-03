import { FastifyRouter } from './router.types.js';

import { test, integration } from '../controllers/apiController.js';

export const router = (fastify: FastifyRouter, _opts, done) => {
  // create route between controller and '/api/' endpoint
  fastify.get('/', test);

  //any GET request in /api is sent to the integration controller
  fastify.get('/:action', {}, integration);
  done();
};
