import express from 'express';
import type { Request, Response, Router } from 'express';
import type { PortInfo } from 'ontime-types';

import { portManager } from '../../classes/port-manager/PortManager.js';
import { validateServerPort } from './serverPort.validation.js';

export const router: Router = express.Router();

router.get('/', (_req: Request, res: Response<PortInfo>) => {
  const { port, pendingRestart } = portManager.getPort();
  res.status(200).json({ port, pendingRestart });
});

router.post(
  '/',
  validateServerPort,
  (req: Request<unknown, PortInfo, { serverPort: number }>, res: Response<PortInfo>) => {
    portManager.changePort(req.body.serverPort);
    const { port, pendingRestart } = portManager.getPort();

    res.status(200).json({ port, pendingRestart });
  },
);
