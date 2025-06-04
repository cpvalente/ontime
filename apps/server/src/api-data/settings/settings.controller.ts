import { ErrorResponse, Settings } from 'ontime-types';
import { getErrorMessage, obfuscate } from 'ontime-utils';

import type { Request, Response } from 'express';

import { isDocker } from '../../setup/environment.js';
import { failEmptyObjects } from '../../utils/routerUtils.js';
import { getDataProvider } from '../../classes/data-provider/DataProvider.js';
import * as appState from '../../services/app-state-service/AppStateService.js';

import { extractPin } from './settings.utils.js';

export async function getSettings(_req: Request, res: Response<Settings>) {
  const settings = getDataProvider().getSettings();
  const obfuscatedSettings = { ...settings };
  if (settings.editorKey) {
    obfuscatedSettings.editorKey = obfuscate(settings.editorKey);
  }

  if (settings.operatorKey) {
    obfuscatedSettings.operatorKey = obfuscate(settings.operatorKey);
  }

  res.status(200).send(obfuscatedSettings);
}

export async function postSettings(req: Request, res: Response<Settings | ErrorResponse>) {
  if (failEmptyObjects(req.body, res)) {
    return;
  }
  try {
    const settings = getDataProvider().getSettings();
    const editorKey = extractPin(req.body?.editorKey, settings.editorKey);
    const operatorKey = extractPin(req.body?.operatorKey, settings.operatorKey);
    const serverPort = Number(req.body?.serverPort);
    //TODO: should this not be part of the validator?
    if (isNaN(serverPort)) {
      return res.status(400).send({ message: `Invalid value found for server port: ${req.body?.serverPort}` });
    }

    const hasChangedPort = settings.serverPort !== serverPort;

    if (isDocker && hasChangedPort) {
      return res.status(403).json({ message: 'Can`t change port when running inside docker' });
    }

    let timeFormat = settings.timeFormat;
    if (req.body?.timeFormat === '12' || req.body?.timeFormat === '24') {
      timeFormat = req.body.timeFormat;
    }

    const language = req.body?.language || 'en';

    const newData = {
      ...settings,
      editorKey,
      operatorKey,
      timeFormat,
      language,
      serverPort,
    };
    await getDataProvider().setSettings(newData);
    res.status(200).send(newData);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
}

export async function postWelcomeDialog(req: Request, res: Response) {
  const show = await appState.setShowWelcomeDialog(req.body.show);
  res.status(200).send({ show });
}
