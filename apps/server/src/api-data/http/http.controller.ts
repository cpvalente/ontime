import type { ErrorResponse, HttpSettings } from 'ontime-types';

import { Request, Response } from 'express';

import { DataProvider } from '../../classes/data-provider/DataProvider.js';
import { failEmptyObjects } from '../../utils/routerUtils.js';
import { httpIntegration } from '../../services/integration-service/HttpIntegration.js';
import { getErrorMessage } from 'ontime-utils';

export async function getHTTP(_req: Request, res: Response<HttpSettings>) {
  const http = DataProvider.getHttp();
  res.status(200).send(http);
}

export async function postHTTP(req: Request, res: Response<HttpSettings | ErrorResponse>) {
  if (failEmptyObjects(req.body, res)) {
    return;
  }

  try {
    const httpSettings = req.body;

    httpIntegration.init(httpSettings);
    // we persist the data after init to avoid persisting invalid data
    const result = await DataProvider.setHttp(httpSettings);
    res.send(result).status(200);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
}
