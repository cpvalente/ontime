/**
 * API Router
 * User to handle all requests which affect runtime
 * It is a mirror implementation of OSC and Websocket Adapters
 *
 */

import { LogOrigin } from 'ontime-types';

import express, { type Request, type Response } from 'express';

import { logger } from '../classes/Logger.js';
import { integrationPayloadFromPath } from '../adapters/utils/parse.js';

import { dispatchFromAdapter } from './integration.controller.js';
import { getErrorMessage } from 'ontime-utils';
import { isEmptyObject } from '../utils/parserUtils.js';

export const integrationRouter = express.Router();

const helloMessage = 'You have reached Ontime API server';

integrationRouter.get('/', (_req: Request, res: Response<{ message: string }>) => {
  res.status(200).json({ message: helloMessage });
});

/**
 * All calls are sent to the dispatcher
 */
integrationRouter.get('/*', (req: Request, res: Response) => {
  let action = req.path.substring(1);
  if (!action) {
    return res.status(400).json({ error: 'No action found' });
  }

  try {
    const actionArray = action.split('/');
    const query = isEmptyObject(req.query) ? undefined : (req.query as object);
    let payload = {};
    if (actionArray.length > 1) {
      action = actionArray.shift();
      payload = integrationPayloadFromPath(actionArray, query);
    } else {
      payload = query;
    }
    const reply = dispatchFromAdapter(action, payload, 'http');
    if (reply.refused) {
      res.status(400).json(reply);
    } else {
      res.status(202).json(reply);
    }
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    logger.error(LogOrigin.Rx, `HTTP IN: ${errorMessage}`);
    res.status(500).send({ message: errorMessage });
  }
});
