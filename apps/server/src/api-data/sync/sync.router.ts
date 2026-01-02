import express from 'express';
import type { Request, Response } from 'express';

export const router = express.Router();

import { body } from 'express-validator';

import { requestValidationFunction } from '../validation-utils/validationFunction.js';
import { syncService } from './sync.service.js';
import { getErrorMessage } from 'ontime-utils';
import { consoleError } from '../../utils/console.js';
import { SyncClientList, SyncRoll } from 'ontime-types';

/**
 * validate array of URL preset objects
 */
export const validateDirector = [
  body().isObject().withMessage('No data found in request'),
  body('host').isString().trim().notEmpty().isURL(),
  body('roll').isString().isIn(Object.values(SyncRoll)),
  requestValidationFunction,
];

router.post('/connect', validateDirector, async (req: Request, res: Response) => {
  const { host, roll } = req.body;
  try {
    if (await syncService.connect(host, roll)) {
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

router.post('/disconnect', async (_req: Request, res: Response) => {
  await syncService.disconnect();
  res.sendStatus(204);
});

router.get('/list', async (_req: Request, res: Response<SyncClientList>) => {
  res.status(200).send(syncService.getClientList());
});
