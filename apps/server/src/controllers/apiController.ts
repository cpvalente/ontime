import { Request } from '../controllers/controller.types.js';
import { RouteHandlerMethod } from 'fastify';
import { dispatchFromAdapter } from './integrationController.js';
import { LogOrigin } from 'ontime-types';
import { logger } from '../classes/Logger.js';

const schema = {
  params: {
    type: 'object',
    required: ['action'],
    properties: {
      action: { type: 'string' },
    },
  },
  querystring: { type: 'object' },
} as const;

const helloMessage = 'You have reached Ontime API server';

/**
 * @description Create controller for GET request to '/events'.
 */
export const test: RouteHandlerMethod = (request, reply) => {
  reply.send({ message: helloMessage });
};

/**
 * @description Create controller for GET request to '/events/cached'
 */
export const integration: RouteHandlerMethod = (request: Request<typeof schema>, reply) => {
  const action = request.params.action;
  const params = { payload: request.query };

  try {
    const result = dispatchFromAdapter(action, params, 'http');
    reply.status(202).send(result);
  } catch (error) {
    logger.error(LogOrigin.Rx, `HTTP IN: ${error}`);
    reply.status(500).send({ error: error.message });
  }
};
