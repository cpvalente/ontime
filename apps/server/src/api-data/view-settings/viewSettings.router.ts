import express from 'express';
import type { Request, Response } from 'express';
import { RefetchKey, type ErrorResponse, type ViewSettings } from 'ontime-types';
import { getErrorMessage } from 'ontime-utils';

import { validateViewSettings } from './viewSettings.validation.js';
import { getDataProvider } from '../../classes/data-provider/DataProvider.js';
import { ifNoneMatch } from '../../middleware/etag.js';
import { sendRefetch } from '../../adapters/WebsocketAdapter.js';

export const router = express.Router();

let revision = 0;

router.get(
  '/',
  (req, res, next) => ifNoneMatch(req, res, next, revision),
  (_req: Request, res: Response<ViewSettings>) => {
    const views = getDataProvider().getViewSettings();
    res.status(200).send(views);
  },
);

router.post('/', validateViewSettings, async (req: Request, res: Response<ViewSettings | ErrorResponse>) => {
  try {
    const newData = {
      dangerColor: req.body.dangerColor,
      endMessage: req.body.endMessage,
      freezeEnd: req.body.freezeEnd,
      normalColor: req.body.normalColor,
      overrideStyles: req.body.overrideStyles,
      warningColor: req.body.warningColor,
    } as ViewSettings;
    await getDataProvider().setViewSettings(newData);
    res.setHeader('etag', ++revision).status(200).send(newData);
    setImmediate(() => {
      sendRefetch(RefetchKey.ViewSettings);
    });
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});
