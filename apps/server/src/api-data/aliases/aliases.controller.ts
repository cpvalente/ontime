import { Alias, AliasSchema, ErrorResponse } from 'ontime-types';

import { Request, Response } from 'express';

import { DataProvider } from '../../classes/data-provider/DataProvider.js';
import { array, safeParse } from 'valibot';

export async function getAliases(_req: Request, res: Response<Alias[]>) {
  const aliases = DataProvider.getAliases();
  res.status(200).send(aliases);
}

export async function postAliases(req: Request, res: Response<Alias[] | ErrorResponse>) {
  const result = safeParse(array(AliasSchema), req.body, { abortEarly: true });
  if (result.success) {
    try {
      const newAliases = result.output;
      await DataProvider.setAliases(newAliases);
      res.status(200).send(newAliases);
    } catch (error) {
      res.status(400).send({ message: String(error) });
    }
  } else {
    res.status(422).send({ message: result.issues[0].message });
  }
}
