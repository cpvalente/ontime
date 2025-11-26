import express from 'express';
import type { Request, Response } from 'express';

export const router = express.Router();

import { body, query } from 'express-validator';

import { requestValidationFunction } from '../validation-utils/validationFunction.js';
import { registerNewUnderstudy, connectToDirector, disconnectFromDirector } from './understudy.service.js';
import { getErrorMessage } from 'ontime-utils';
import { consoleError } from '../../utils/console.js';

/**
 * validate array of URL preset objects
 */
export const validateDirector = [
  body().isObject().withMessage('No data found in request'),
  body('host').isString().trim().notEmpty().isURL(),
  requestValidationFunction,
];

router.post('/connect', validateDirector, async (req: Request, res: Response) => {
  const { host } = req.body;
  try {
    if (await connectToDirector(host)) {
      res.sendStatus(200);
    } else {
      res.status(422).send('Failed health check');
    }
  } catch (error) {
    const message = getErrorMessage(error);
    consoleError(message);
    res.status(500).send(message);
  }
});

router.delete('/host', async (_req: Request, res: Response) => {
  await disconnectFromDirector();
  res.sendStatus(204);
});

export const validatePoll = [query('id').isString().trim().notEmpty(), requestValidationFunction];

router.get('/poll', validatePoll, async (req: Request, res: Response) => {
  const sendData = (data: any) => {
    res.json(data);
  };
  const id = req.query.id as string;
  registerNewUnderstudy(sendData, id);
});
