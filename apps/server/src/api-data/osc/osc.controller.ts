import type { ErrorResponse, OSCSettings } from 'ontime-types';

import { Request, Response } from 'express';

import { DataProvider } from '../../classes/data-provider/DataProvider.js';
import { failEmptyObjects } from '../../utils/routerUtils.js';
import { oscIntegration } from '../../services/integration-service/OscIntegration.js';
import { startOSCServer } from '../../app.js';

export async function getOSC(_req: Request, res: Response<OSCSettings>) {
  const osc = DataProvider.getOsc();
  res.status(200).send(osc);
}

export async function postOSC(req: Request, res: Response<OSCSettings | ErrorResponse>) {
  if (failEmptyObjects(req.body, res)) {
    return;
  }

  try {
    const oscSettings = req.body;

    oscIntegration.init(oscSettings);
    await startOSCServer();
    // we persist the data after init to avoid persisting invalid data
    const result = await DataProvider.setOsc(oscSettings);

    res.send(result).status(200);
  } catch (error) {
    res.status(400).send({ message: String(error) });
  }
}
