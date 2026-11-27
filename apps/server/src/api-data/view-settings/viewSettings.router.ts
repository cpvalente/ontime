import express from 'express';
import type { Request, Response, Router } from 'express';
import type { ViewSettings } from 'ontime-types';

import * as viewSettingsDao from './viewSettings.dao.js';
import { validateViewSettings } from './viewSettings.validation.js';

export const router: Router = express.Router();

router.get('/', (_req: Request, res: Response<ViewSettings>) => {
  const views = viewSettingsDao.getViewSettings();
  res.status(200).json(views);
});

router.post(
  '/',
  validateViewSettings,
  async (req: Request<unknown, ViewSettings, ViewSettings>, res: Response<ViewSettings>) => {
    const newData = await viewSettingsDao.editViewSettings(req.body);
    res.status(200).json(newData);
  },
);
