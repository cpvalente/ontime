/**
 * API Router
 * User to handle all requests which affect runtime
 * It is a mirror implementation of OSC and Websocket Adapters
 *
 */

import { ErrorResponse, LogOrigin, RuntimeStore } from 'ontime-types';

import express, { type Request, type Response } from 'express';

import { logger } from '../classes/Logger.js';
import { objectFromPath } from '../adapters/utils/parse.js';

import { dispatchFromAdapter } from './integration.controller.js';
import { getErrorMessage } from 'ontime-utils';
import { eventStore } from '../stores/EventStore.js';

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
    const params = { payload: req.query as object } as { payload: object | null };

    if (actionArray.length > 1) {
      action = actionArray.shift() || '';
      params.payload = objectFromPath(actionArray, params.payload);
    }

    const reply = dispatchFromAdapter(action, params, 'http');
    res.status(202).json(reply);
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    logger.error(LogOrigin.Rx, `HTTP IN: ${errorMessage}`);
    res.status(500).send({ message: errorMessage });
  }
});

integrationRouter.get('/poll', (_req: Request, res: Response<Partial<RuntimeStore> | ErrorResponse>) => {
  try {
    const state = eventStore.poll();
    res.status(200).send(state);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(500).send({ message: `Could not get sync data: ${message}` });
  }
});
