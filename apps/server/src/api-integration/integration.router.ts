/**
 * API Router
 * User to handle all requests which affect runtime
 * It is a mirror implementation of OSC and Websocket Adapters
 *
 */

import { ErrorResponse, LogOrigin } from 'ontime-types';

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
integrationRouter.get('/*splat', (req: Request, res: Response<ErrorResponse | { payload: unknown }>) => {
  let action = req.path.substring(1);
  if (!action) {
    res.status(400).json({ message: 'No action found' });
    return;
  }

  try {
    const actionArray = action.split('/');
    const query = isEmptyObject(req.query) ? undefined : (req.query as object);
    let payload: unknown = {};
    if (actionArray.length > 1) {
      // @ts-expect-error -- we decide to give up on typing here
      action = actionArray.shift();
      payload = integrationPayloadFromPath(actionArray, query);
    } else {
      payload = query;
    }
    const reply = dispatchFromAdapter(action, payload, 'http');
    res.status(202).json(reply);
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    logger.error(LogOrigin.Rx, `HTTP IN: ${errorMessage}`);
    res.status(500).send({ message: errorMessage });
  }
});
