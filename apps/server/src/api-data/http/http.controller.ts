import type { ErrorResponse, HttpSettings } from 'ontime-types';
import { HttpSettingsSchema } from 'ontime-types';
import { parse } from 'valibot';
import { Request, Response } from 'express';

import { DataProvider } from '../../classes/data-provider/DataProvider.js';
import { httpIntegration } from '../../services/integration-service/HttpIntegration.js';

export async function getHTTP(_req: Request, res: Response<HttpSettings>) {
  const http = DataProvider.getHttp();
  res.status(200).send(http);
}

export async function postHTTP(req: Request, res: Response<HttpSettings | ErrorResponse>) {
  try {
    const httpSettings = parse(HttpSettingsSchema, req.body);
    httpIntegration.init(httpSettings);
    // we persist the data after init to avoid persisting invalid data
    const result = await DataProvider.setHttp(httpSettings);
    res.send(result).status(200);
  } catch (err) {
    if (err.name === 'ValiError') {
      res.status(422).send({ message: err.issues[0].message });
    } else {
      res.status(400).send({ message: String(err) });
    }
  }
}
