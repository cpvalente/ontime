import express from 'express';
import type { Request, Response, Router } from 'express';
import type { ErrorResponse, TeleprompterScript, TeleprompterSettings } from 'ontime-types';
import { getErrorMessage } from 'ontime-utils';

import { getDataProvider } from '../../classes/data-provider/DataProvider.js';
import {
  applyTeleprompterSettings,
  getSharedScript,
} from '../../services/teleprompter-service/teleprompter.service.js';

export const router: Router = express.Router();

router.get('/settings', (_req: Request, res: Response<TeleprompterSettings>) => {
  res.status(200).send(getDataProvider().getTeleprompterSettings());
});

router.post('/settings', async (req: Request, res: Response<TeleprompterSettings | ErrorResponse>) => {
  try {
    res.status(200).send(await applyTeleprompterSettings(req.body));
  } catch (error) {
    res.status(400).send({ message: getErrorMessage(error) });
  }
});

/** The script every teleprompter view reads, built from the project's settings */
router.get('/script', (_req: Request, res: Response<TeleprompterScript>) => {
  res.status(200).send(getSharedScript());
});
