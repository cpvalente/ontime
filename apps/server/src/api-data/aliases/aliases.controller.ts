import type { Alias, ErrorResponse } from 'ontime-types';

import { Request, Response } from 'express';

import { DataProvider } from '../../classes/data-provider/DataProvider.js';
import { failIsNotArray } from '../../utils/routerUtils.js';

export async function getAliases(_req: Request, res: Response<Alias[]>) {
  const aliases = DataProvider.getAliases();
  res.status(200).send(aliases);
}

export async function postAliases(req: Request, res: Response<Alias[] | ErrorResponse>) {
  if (failIsNotArray(req.body, res)) {
    return;
  }
  try {
    const newAliases: Alias[] = [];
    req.body.forEach((a) => {
      newAliases.push({
        enabled: a.enabled,
        alias: a.alias,
        pathAndParams: a.pathAndParams,
      });
    });
    await DataProvider.setAliases(newAliases);
    res.status(200).send(newAliases);
  } catch (error) {
    res.status(400).send({ message: String(error) });
  }
}
