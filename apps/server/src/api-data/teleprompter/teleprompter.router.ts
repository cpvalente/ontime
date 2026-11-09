import express from 'express';
import type { Request, Response, Router } from 'express';
import type { TeleprompterScript, TeleprompterSettings } from 'ontime-types';

import { getDataProvider } from '../../classes/data-provider/DataProvider.js';
import { applyTeleprompterSettings, getScript } from '../../services/teleprompter-service/teleprompter.service.js';
import { validateTeleprompterSettings } from './teleprompter.validation.js';

export const router: Router = express.Router();

router.get('/settings', (_req: Request, res: Response<TeleprompterSettings>) => {
  res.status(200).send(getDataProvider().getTeleprompterSettings());
});

router.post('/settings', validateTeleprompterSettings, async (req: Request, res: Response<TeleprompterSettings>) => {
  res.status(200).send(await applyTeleprompterSettings(req.body));
});

/**
 * The script a teleprompter view reads, built from the project's settings
 * A view which plays on its own can name another field as its source
 */
router.get('/script', (req: Request, res: Response<TeleprompterScript>) => {
  const { source } = req.query;
  res.status(200).send(getScript(typeof source === 'string' ? source : undefined));
});
