import type { ErrorResponse, URLPreset } from 'ontime-types';

import { Request, Response } from 'express';

import { DataProvider } from '../../classes/data-provider/DataProvider.js';
import { failIsNotArray } from '../../utils/routerUtils.js';

export async function getUrlPresets(_req: Request, res: Response<URLPreset[]>) {
  const presets = DataProvider.getUrlPresets();
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
    await DataProvider.setUrlPresets(newPresets);
    res.status(200).send(newPresets);
  } catch (error) {
    res.status(400).send({ message: String(error) });
  }
}
