import express from 'express';
import type { Request, Response, Router } from 'express';
import type { Settings, SettingsPatch } from 'ontime-types';
import { obfuscate } from 'ontime-utils';

import * as settingsDao from './settings.dao.js';
import { validateSettingsPatch } from './settings.validation.js';

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

router.get('/', (_req: Request, res: Response<Settings>) => {
  const settings = settingsDao.getSettings();
  res.status(200).json(obfuscateKeys(settings));
});

router.patch(
  '/',
  validateSettingsPatch,
  async (req: Request<unknown, Settings, SettingsPatch>, res: Response<Settings>) => {
    const data = await settingsDao.editSettings(req.body);
    res.status(200).json(obfuscateKeys(data));
  },
);
