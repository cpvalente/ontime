import express from 'express';
import type { Request, Response, Router } from 'express';
import type { GetInfo, GetUrl, PortInfo, SessionStats } from 'ontime-types';

import { portManager } from '../../classes/port-manager/PortManager.js';
import * as appState from '../../services/app-state-service/appState.service.js';
import * as sessionService from './session.service.js';
import { validateGenerateUrl, validateServerPort, validateWelcomeDialog } from './session.validation.js';

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

router.get('/port', (_req: Request, res: Response<PortInfo>) => {
  const { port, pendingRestart } = portManager.getPort();
  res.status(200).json({ port, pendingRestart });
});

router.post(
  '/port',
  validateServerPort,
  (req: Request<unknown, PortInfo, { serverPort: number }>, res: Response<PortInfo>) => {
    portManager.changePort(req.body.serverPort);
    const { port, pendingRestart } = portManager.getPort();
    res.status(200).json({ port, pendingRestart });
  },
);

router.get('/welcome-dialog', async (_req: Request, res: Response<{ show: boolean }>) => {
  const show = await appState.getShowWelcomeDialog();
  res.status(200).json({ show });
});

router.post(
  '/welcome-dialog',
  validateWelcomeDialog,
  async (req: Request<unknown, { show: boolean }, { show: boolean }>, res: Response<{ show: boolean }>) => {
    const show = await appState.setShowWelcomeDialog(req.body.show);
    res.status(200).json({ show });
  },
);
