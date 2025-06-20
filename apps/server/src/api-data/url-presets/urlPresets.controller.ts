import type { ErrorResponse, URLPreset } from 'ontime-types';
import { getErrorMessage } from 'ontime-utils';

import type { Request, Response } from 'express';

import { failIsNotArray } from '../../utils/routerUtils.js';
import { getDataProvider } from '../../classes/data-provider/DataProvider.js';

export async function getUrlPresets(_req: Request, res: Response<URLPreset[]>) {
  const presets = getDataProvider().getUrlPresets();
  res.status(200).send(presets as URLPreset[]);
}

export async function postUrlPresets(req: Request, res: Response<URLPreset[] | ErrorResponse>) {
  if (failIsNotArray(req.body, res)) {
    return;
  }
  try {
    const newPresets: URLPreset[] = req.body.map((preset) => ({
      enabled: preset.enabled,
      alias: preset.alias,
      pathAndParams: preset.pathAndParams,
    }));
    await getDataProvider().setUrlPresets(newPresets);
    res.status(200).send(newPresets);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
}
