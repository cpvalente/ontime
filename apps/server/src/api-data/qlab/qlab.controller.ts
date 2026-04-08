import { ErrorResponse, QlabSettings } from 'ontime-types';
import { getErrorMessage } from 'ontime-utils';

import type { Request, Response } from 'express';

import { failEmptyObjects } from '../../utils/routerUtils.js';
import { getDataProvider } from '../../classes/data-provider/DataProvider.js';
import { qlabService } from '../../services/qlab-service/QlabService.js';

export async function getQlabSettings(_req: Request, res: Response<QlabSettings>) {
  const settings = getDataProvider().getQlab();
  res.status(200).send(settings);
}

export async function postQlabSettings(req: Request, res: Response<QlabSettings | ErrorResponse>) {
  if (failEmptyObjects(req.body, res)) {
    return;
  }
  try {
    const newData: QlabSettings = {
      enabled: req.body.enabled,
      host: req.body.host,
      port: req.body.port,
      listenPort: req.body.listenPort,
      filterByColor: req.body.filterByColor || null,
      filterByType: req.body.filterByType || null,
      filterByCueNumber: req.body.filterByCueNumber || null,
      warningThreshold: req.body.warningThreshold,
      dangerThreshold: req.body.dangerThreshold,
      timeout: req.body.timeout,
    };

    await getDataProvider().setQlab(newData);
    qlabService.updateSettings(newData);
    res.status(200).send(newData);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
}
