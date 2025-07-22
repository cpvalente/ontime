import express from 'express';
import type { Request, Response } from 'express';
import { getErrorMessage } from 'ontime-utils';
import type { ErrorResponse, GetInfo, GetUrl, SessionStats } from 'ontime-types';
import { validateGenerateUrl } from './session.validation.js';
import * as sessionService from './session.service.js';

export const router = express.Router();

router.get('/', async (_req: Request, res: Response<SessionStats | ErrorResponse>) => {
  try {
    const stats = await sessionService.getSessionStats();
    res.status(200).send(stats);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(500).send({ message });
  }
});

router.get('/info', async (_req: Request, res: Response<GetInfo | ErrorResponse>) => {
  try {
    const info = await sessionService.getInfo();
    res.status(200).send(info);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(500).send({ message });
  }
});

router.post('/url', validateGenerateUrl, (req: Request, res: Response<GetUrl | ErrorResponse>) => {
  try {
    const url = sessionService.generateShareUrl(req.body.baseUrl, req.body.path, {
      authenticate: req.body.authenticate,
      lockConfig: req.body.lockConfig,
      lockNav: req.body.lockNav,
      preset: req.body.preset,
    });
    res.status(200).send({ url: url.toString() });
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(500).send({ message });
  }
});
