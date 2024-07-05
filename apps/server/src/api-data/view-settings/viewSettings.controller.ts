import type { ErrorResponse, ViewSettings } from 'ontime-types';
import { getErrorMessage } from 'ontime-utils';

import type { Request, Response } from 'express';

import { getDataProvider } from '../../classes/data-provider/DataProvider.js';

export async function getViewSettings(_req: Request, res: Response<ViewSettings>) {
  const views = getDataProvider().getViewSettings();
  res.status(200).send(views);
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
    res.status(200).send(newData);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
}
