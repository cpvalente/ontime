import express from 'express';
import type { Request, Response, Router } from 'express';
import type { TeleprompterScript } from 'ontime-types';

import { getDataProvider } from '../../classes/data-provider/DataProvider.js';
import { buildScriptWith, getSharedScript } from '../../services/teleprompter-service/teleprompter.service.js';
import { isEmptyObject } from '../../utils/parserUtils.js';
import { parseTeleprompterSettings } from '../view-settings/viewSettings.parser.js';

export const router: Router = express.Router();

/** The server clock, which screens sync to, to calculate the reading position from the transport */
router.get('/clock', (_req: Request, res: Response<{ now: number }>) => {
  res.status(200).send({ now: Date.now() });
});

/**
 * Remote screens and controllers ask without parameters and get the shared script
 * Local views pass their own settings, eg: ?script=note&charsPerLine=40
 */
router.get('/script', (req: Request, res: Response<TeleprompterScript>) => {
  if (isEmptyObject(req.query)) {
    res.status(200).send(getSharedScript());
    return;
  }

  const settings = parseTeleprompterSettings(req.query, getDataProvider().getViewSettings().teleprompter);
  res.status(200).send(buildScriptWith(settings));
});
