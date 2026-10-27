import express from 'express';
import type { Request, Response, Router } from 'express';

import { defaultCss } from '../../bundle/bundledCss.js';
import { setOverrideStyles } from '../view-settings/viewSettings.dao.js';
import { readCssFile, writeCssFile, writeUserTranslation } from './assets.service.js';
import { validatePostCss, validatePostTranslation } from './assets.validation.js';

export const router: Router = express.Router();

router.get('/css', async (_req: Request, res: Response<string>) => {
  const data = await readCssFile();
  res.status(200).send(data);
});

router.get('/css/example', (_req: Request, res: Response<string>) => {
  res.status(200).send(defaultCss);
});

router.post('/css', validatePostCss, async (req: Request, res: Response<never>) => {
  const { css, enabled } = req.body;
  await writeCssFile(css);
  if (enabled) {
    await setOverrideStyles(true);
  }
  res.status(204).send();
});

router.post('/css/restore', async (_req: Request, res: Response<string>) => {
  await writeCssFile(defaultCss);
  res.status(200).send(defaultCss);
});

router.post('/translations', validatePostTranslation, async (req: Request, res: Response<never>) => {
  await writeUserTranslation(req.body.translation);
  res.status(204).send();
});
