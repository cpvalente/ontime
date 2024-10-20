import { getErrorMessage } from 'ontime-utils';
import { ErrorResponse, GetInfo } from 'ontime-types';

import type { Request, Response } from 'express';

import * as sessionService from './session.service.js';

export async function getInfo(_req: Request, res: Response<GetInfo | ErrorResponse>) {
  try {
    const info = await sessionService.getInfo();
    res.status(200).send(info);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(500).send({ message });
  }
}
