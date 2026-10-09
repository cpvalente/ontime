import express from 'express';
import type { Request, Response, Router } from 'express';
import type { ErrorResponse, ViewSettings } from 'ontime-types';
import { getErrorMessage } from 'ontime-utils';

import * as viewSettingsDao from './viewSettings.dao.js';
import { validateViewSettings } from './viewSettings.validation.js';

export const router: Router = express.Router();

router.get('/', (_req: Request, res: Response<ViewSettings>) => {
  const views = viewSettingsDao.getViewSettings();
  res.status(200).send(views);
});

router.post('/', validateViewSettings, async (req: Request, res: Response<ViewSettings | ErrorResponse>) => {
  try {
    const newData = {
      dangerColor: req.body.dangerColor,
      normalColor: req.body.normalColor,
      overrideStyles: req.body.overrideStyles,
      warningColor: req.body.warningColor,
    } as ViewSettings;
    await viewSettingsDao.editViewSettings(newData);
    res.status(200).send(newData);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});
