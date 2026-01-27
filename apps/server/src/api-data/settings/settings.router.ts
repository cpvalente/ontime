import express from 'express';
import { matchedData } from 'express-validator';
import type { Request, Response } from 'express';
import { deepEqual } from 'fast-equals';

import { ErrorResponse, RefetchKey, Settings } from 'ontime-types';
import { getErrorMessage, obfuscate } from 'ontime-utils';

import { validateSettings, validateWelcomeDialog, validateServerPort } from './settings.validation.js';
import { getDataProvider } from '../../classes/data-provider/DataProvider.js';
import * as appState from '../../services/app-state-service/AppStateService.js';
import { isDocker } from '../../setup/environment.js';
import { sendRefetch } from '../../adapters/WebsocketAdapter.js';

export const router = express.Router();

router.post('/welcomedialog', validateWelcomeDialog, async (req: Request, res: Response) => {
  const show = await appState.setShowWelcomeDialog(req.body.show);
  res.status(200).json({ show });
});

router.get('/', (_req: Request, res: Response<Settings>) => {
  const settings = getDataProvider().getSettings();
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
    const data = matchedData<Settings>(req);
    const settings = getDataProvider().getSettings();

    data.version = settings.version;

    if (!deepEqual(data, settings)) {
      await getDataProvider().setSettings(data);
      sendRefetch(RefetchKey.Settings);
    }

    res.status(200).json(data);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).json({ message });
  }
});

router.get('/serverport', async (_req: Request, res: Response<{ serverPort: number } | ErrorResponse>) => {
  try {
    const serverPort = await appState.getServerPort();
    res.status(200).json({ serverPort });
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).json({ message });
  }
});

router.post(
  '/serverport',
  validateServerPort,
  async (req: Request, res: Response<{ serverPort: number } | ErrorResponse>) => {
    if (isDocker) {
      res.status(403).json({ message: 'Can`t change port when running inside docker' });
      return;
    }

    try {
      const data = matchedData<{ serverPort: number }>(req);
      await appState.setServerPort(data.serverPort);
      res.status(200).json({ serverPort: data.serverPort });
    } catch (error) {
      const message = getErrorMessage(error);
      res.status(400).json({ message });
    }
  },
);
