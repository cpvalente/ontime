import type { ErrorResponse, ViewSettings } from 'ontime-types';

import { Request, Response } from 'express';

import { DataProvider } from '../../classes/data-provider/DataProvider.js';
import { failEmptyObjects } from '../../utils/routerUtils.js';
import { getErrorMessage } from 'ontime-utils';

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
      dangerColor: req.body.dangerColor,
      endMessage: req.body?.endMessage ?? '',
      freezeEnd: req.body.freezeEnd,
      normalColor: req.body.normalColor,
      overrideStyles: req.body.overrideStyles,
      warningColor: req.body.warningColor,
    };
    await DataProvider.setViewSettings(newData);
    res.status(200).send(newData);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
}
