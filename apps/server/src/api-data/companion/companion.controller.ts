import type { CompanionSettings, ErrorResponse } from 'ontime-types';
import { getErrorMessage } from 'ontime-utils';

import type { Request, Response } from 'express';

import { failEmptyObjects } from '../../utils/routerUtils.js';
import { getDataProvider } from '../../classes/data-provider/DataProvider.js';

export async function getCompanion(_req: Request, res: Response<CompanionSettings>) {
  const companion = getDataProvider().getCompanion();
  res.status(200).send(companion);
}

export async function postCompanion(req: Request, res: Response<CompanionSettings | ErrorResponse>) {
  if (failEmptyObjects(req.body, res)) {
    return;
  }

  try {
    const companionSettings = req.body;

    // oscIntegration.init(companionSettings);
    // we persist the data after init to avoid persisting invalid data
    const result = await getDataProvider().setCompanion(companionSettings);

    res.send(result).status(200);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
}
