import express from 'express';
import type { Request, Response } from 'express';
import { RefetchKey, type ErrorResponse, type ViewSettings } from 'ontime-types';
import { getErrorMessage } from 'ontime-utils';

import { validateViewSettings } from './viewSettings.validation.js';
import { getDataProvider } from '../../classes/data-provider/DataProvider.js';
import { sendRefetch } from '../../adapters/WebsocketAdapter.js';

export const router = express.Router();

router.get('/', (_req: Request, res: Response<ViewSettings>) => {
  const views = getDataProvider().getViewSettings();
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
    await getDataProvider().setViewSettings(newData);

    setImmediate(() => {
      sendRefetch(RefetchKey.ViewSettings);
    });

    res.status(200).send(newData);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});
