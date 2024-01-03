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
export const test: RouteHandlerMethod = (req, res) => {
  res.send({ message: helloMessage });
};

/**
 * @description Create controller for GET request to '/events/cached'
 */
export const integration: RouteHandlerMethod = (req: Request<typeof schema>, res) => {
  const action = req.params.action;
  const params = { payload: req.query };

  try {
    const result = dispatchFromAdapter(action, params, 'http');
    res.status(202).send(result);
  } catch (error) {
    logger.error(LogOrigin.Rx, `HTTP IN: ${error}`);
    res.status(500).send({ error: error.message });
  }
};
