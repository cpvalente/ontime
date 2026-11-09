import express from 'express';
import type { Request, Response, Router } from 'express';
import type { GetInfo, GetUrl, SessionStats } from 'ontime-types';

import * as sessionService from './session.service.js';
import { validateGenerateUrl } from './session.validation.js';

export const router: Router = express.Router();

router.get('/', async (_req: Request, res: Response<SessionStats>) => {
  const stats = await sessionService.getSessionStats();
  res.status(200).send(stats);
});

router.get('/info', (_req: Request, res: Response<GetInfo>) => {
  const info = sessionService.getInfo();
  res.status(200).send(info);
});

router.post('/url', validateGenerateUrl, (req: Request, res: Response<GetUrl>) => {
  const url = sessionService.generateShareUrl(req.body.baseUrl, req.body.path, {
    authenticate: req.body.authenticate,
    lockConfig: req.body.lockConfig,
    lockNav: req.body.lockNav,
    preset: req.body.preset,
  });
  res.status(200).send({ url: url.toString() });
});
