import express from 'express';
import type { Request, Response, Router } from 'express';
import { matchedData } from 'express-validator';
import type { ErrorResponse, ViewSettings } from 'ontime-types';
import { getErrorMessage } from 'ontime-utils';

import * as viewSettingsDao from './viewSettings.dao.js';
import { validateViewSettings } from './viewSettings.validation.js';

export const router: Router = express.Router();

router.get('/', (_req: Request, res: Response<ViewSettings>) => {
  const views = viewSettingsDao.getViewSettings();
  res.status(200).json(views);
});

router.post('/', validateViewSettings, async (req: Request, res: Response<ViewSettings | ErrorResponse>) => {
  try {
    const newData = await viewSettingsDao.editViewSettings(matchedData<ViewSettings>(req));
    res.status(200).json(newData);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).json({ message });
  }
});
