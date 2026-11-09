import express from 'express';
import type { Request, Response, Router } from 'express';
import { matchedData } from 'express-validator';
import { PortInfo, Settings } from 'ontime-types';
import { obfuscate } from 'ontime-utils';

import { portManager } from '../../classes/port-manager/PortManager.js';
import * as appState from '../../services/app-state-service/appState.service.js';
import * as settingsDao from './settings.dao.js';
import { validateSettings, validateWelcomeDialog, validateServerPort } from './settings.validation.js';

export const router: Router = express.Router();

function obfuscateKeys(settings: Readonly<Settings>): Settings {
  const obfuscatedSettings = { ...settings };
  if (settings.editorKey) {
    obfuscatedSettings.editorKey = obfuscate(settings.editorKey);
  }

  if (settings.operatorKey) {
    obfuscatedSettings.operatorKey = obfuscate(settings.operatorKey);
  }

  return obfuscatedSettings;
}

router.get('/welcomedialog', async (_req: Request, res: Response<{ show: boolean }>) => {
  const show = await appState.getShowWelcomeDialog();
  res.status(200).json({ show });
});

router.post('/welcomedialog', validateWelcomeDialog, async (req: Request, res: Response) => {
  const show = await appState.setShowWelcomeDialog(req.body.show);
  res.status(200).json({ show });
});

router.get('/', (_req: Request, res: Response<Settings>) => {
  const settings = settingsDao.getSettings();
  res.status(200).json(obfuscateKeys(settings));
});

router.post('/', validateSettings, async (req: Request, res: Response<Settings>) => {
  const data = await settingsDao.editSettings(matchedData<Settings>(req));
  res.status(200).json(obfuscateKeys(data));
});

router.get('/serverport', (_req: Request, res: Response<PortInfo>) => {
  const { port, pendingRestart } = portManager.getPort();
  res.status(200).json({ port, pendingRestart });
});

router.post('/serverport', validateServerPort, (req: Request, res: Response<PortInfo>) => {
  const { serverPort } = matchedData<{ serverPort: number }>(req);
  portManager.changePort(serverPort);
  const { port, pendingRestart } = portManager.getPort();

  res.status(200).json({ port, pendingRestart });
});
