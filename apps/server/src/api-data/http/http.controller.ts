import type { ErrorResponse, HttpSettings } from 'ontime-types';
import { getErrorMessage } from 'ontime-utils';

import type { Request, Response } from 'express';

import { failEmptyObjects } from '../../utils/routerUtils.js';
import { httpIntegration } from '../../services/integration-service/HttpIntegration.js';
import { getDataProvider } from '../../classes/data-provider/DataProvider.js';

export async function getHTTP(_req: Request, res: Response<HttpSettings>) {
  const http = getDataProvider().getHttp();
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
    const result = await getDataProvider().setHttp(httpSettings);
    res.send(result).status(200);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
}
