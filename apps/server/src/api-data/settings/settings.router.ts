import express from 'express';
import type { Request, Response, Router } from 'express';
import { matchedData } from 'express-validator';
import { ErrorResponse, PortInfo, Settings } from 'ontime-types';
import { getErrorMessage, obfuscate } from 'ontime-utils';

import { portManager } from '../../classes/port-manager/PortManager.js';
import * as appState from '../../services/app-state-service/appState.service.js';
import * as settingsDao from './settings.dao.js';
import { validateSettings, validateWelcomeDialog, validateServerPort } from './settings.validation.js';

export const router: Router = express.Router();

router.post('/welcomedialog', validateWelcomeDialog, async (req: Request, res: Response) => {
  const show = await appState.setShowWelcomeDialog(req.body.show);
  res.status(200).json({ show });
});

router.get('/', (_req: Request, res: Response<Settings>) => {
  const settings = settingsDao.getSettings();
  const obfuscatedSettings = { ...settings };
  if (settings.editorKey) {
    obfuscatedSettings.editorKey = obfuscate(settings.editorKey);
  }

  if (settings.operatorKey) {
    obfuscatedSettings.operatorKey = obfuscate(settings.operatorKey);
  }

  res.status(200).json(obfuscatedSettings);
});

router.post('/', validateSettings, async (req: Request, res: Response<Settings | ErrorResponse>) => {
  try {
    const data = await settingsDao.editSettings(matchedData<Settings>(req));
    res.status(200).json(data);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).json({ message });
  }
});

router.get('/serverport', (_req: Request, res: Response<PortInfo | ErrorResponse>) => {
  try {
    const { port, pendingRestart } = portManager.getPort();
    res.status(200).json({ port, pendingRestart });
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(500).json({ message });
  }
});

router.post('/serverport', validateServerPort, async (req: Request, res: Response<PortInfo | ErrorResponse>) => {
  try {
    const { serverPort } = matchedData<{ serverPort: number }>(req);
    portManager.changePort(serverPort);
    const { port, pendingRestart } = portManager.getPort();

    res.status(200).json({ port, pendingRestart });
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).json({ message });
  }
});
