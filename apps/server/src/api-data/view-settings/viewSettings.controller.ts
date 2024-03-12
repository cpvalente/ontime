import type { ErrorResponse, ViewSettings } from 'ontime-types';

import { Request, Response } from 'express';

import { DataProvider } from '../../classes/data-provider/DataProvider.js';
import { failEmptyObjects } from '../../utils/routerUtils.js';
import { toErrorResponse } from 'ontime-utils';

export async function getViewSettings(_req: Request, res: Response<ViewSettings>) {
  const views = DataProvider.getViewSettings();
  res.status(200).send(views);
}

export async function postViewSettings(req: Request, res: Response<ViewSettings | ErrorResponse>) {
  if (failEmptyObjects(req.body, res)) {
    return;
  }

  try {
    const newData = {
      overrideStyles: req.body.overrideStyles,
      endMessage: req.body?.endMessage || '',
      normalColor: req.body.normalColor,
      warningColor: req.body.warningColor,
      dangerColor: req.body.dangerColor,
    };
    await DataProvider.setViewSettings(newData);
    res.status(200).send(newData);
  } catch (error) {
    res.status(400).send(toErrorResponse(error));
  }
}
