import type { ErrorResponse, OSCSettings } from 'ontime-types';
import { getErrorMessage } from 'ontime-utils';

import type { Request, Response } from 'express';

import { failEmptyObjects } from '../../utils/routerUtils.js';
import { oscIntegration } from '../../services/integration-service/OscIntegration.js';
import { getDataProvider } from '../../classes/data-provider/DataProvider.js';

export async function getOSC(_req: Request, res: Response<OSCSettings>) {
  const osc = getDataProvider().getOsc();
  res.status(200).send(osc);
}

export async function postOSC(req: Request, res: Response<OSCSettings | ErrorResponse>) {
  if (failEmptyObjects(req.body, res)) {
    return;
  }

  try {
    const oscSettings = req.body;

    oscIntegration.init(oscSettings);
    // we persist the data after init to avoid persisting invalid data
    const result = await getDataProvider().setOsc(oscSettings);

    res.send(result).status(200);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
}
