import { ErrorResponse, Settings } from 'ontime-types';

import { Request, Response } from 'express';

import { DataProvider } from '../../classes/data-provider/DataProvider.js';
import { failEmptyObjects } from '../../utils/routerUtils.js';
import { extractPin } from '../../services/project-service/ProjectService.js';
import { isDocker } from '../../setup/index.js';
import { toErrorResponse } from 'ontime-utils';

export async function getSettings(_req: Request, res: Response<Settings>) {
  const settings = DataProvider.getSettings();
  res.status(200).send(settings);
}

export async function postSettings(req: Request, res: Response<Settings | ErrorResponse>) {
  if (failEmptyObjects(req.body, res)) {
    return;
  }
  try {
    const settings = DataProvider.getSettings();
    const editorKey = extractPin(req.body?.editorKey, settings.editorKey);
    const operatorKey = extractPin(req.body?.operatorKey, settings.operatorKey);
    const serverPort = Number(req.body?.serverPort);
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
    await DataProvider.setSettings(newData);
    res.status(200).send(newData);
  } catch (error) {
    res.status(400).send(toErrorResponse(error));
  }
}
