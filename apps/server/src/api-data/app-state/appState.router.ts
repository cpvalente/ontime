import express from 'express';
import type { Request, Response, Router } from 'express';

import * as appState from '../../services/app-state-service/appState.service.js';
import { validateWelcomeDialog } from './appState.validation.js';

export const router: Router = express.Router();

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
