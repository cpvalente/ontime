import { getErrorMessage } from 'ontime-utils';
import { ErrorResponse, GetInfo, GetUrl, SessionStats } from 'ontime-types';

import type { Request, Response } from 'express';

import * as sessionService from './session.service.js';

export async function getSessionStats(_req: Request, res: Response<SessionStats | ErrorResponse>) {
  try {
    const stats = await sessionService.getSessionStats();
    res.status(200).send(stats);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(500).send({ message });
  }
}

export async function getInfo(_req: Request, res: Response<GetInfo | ErrorResponse>) {
  try {
    const info = await sessionService.getInfo();
    res.status(200).send(info);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(500).send({ message });
  }
}

export async function generateUrl(req: Request, res: Response<GetUrl | ErrorResponse>) {
  try {
    const url = sessionService.generateAuthenticatedUrl(
      req.body.baseUrl,
      req.body.path,
      req.body.lock,
      req.body.authenticate,
    );
    res.status(200).send({ url: url.toString() });
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(500).send({ message });
  }
}
