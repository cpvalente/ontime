import { RefetchKey, type ErrorResponse, type ViewSettings } from 'ontime-types';
import { getErrorMessage } from 'ontime-utils';

import type { Request, Response } from 'express';

import { getDataProvider } from '../../classes/data-provider/DataProvider.js';
import { sendRefetch } from '../../adapters/websocketAux.js';

let revision = 0;

export async function getViewSettings(req: Request, res: Response<ViewSettings>) {
  res.setHeader('etag', revision);
  const etag = req.headers['if-none-match'];
  if (etag && Number(etag) === revision) {
    res.status(304).send();
  } else {
    const views = getDataProvider().getViewSettings();
    res.status(200).send(views);
  }
}

export async function postViewSettings(req: Request, res: Response<ViewSettings | ErrorResponse>) {
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
    revision++;
    res.setHeader('etag', revision);
    res.status(200).send(newData);
    setImmediate(() => {
      sendRefetch(RefetchKey.ViewSettings, revision);
    });
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
}
