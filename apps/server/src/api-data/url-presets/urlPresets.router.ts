import express from 'express';
import type { Request, Response } from 'express';
import type { ErrorResponse, URLPreset } from 'ontime-types';
import { getErrorMessage } from 'ontime-utils';
import { validateUrlPresets } from './urlPresets.validation.js';
import { getDataProvider } from '../../classes/data-provider/DataProvider.js';

export const router = express.Router();

router.get('/', (_req: Request, res: Response<URLPreset[]>) => {
  const presets = getDataProvider().getUrlPresets();
  res.status(200).send(presets as URLPreset[]);
});

router.post('/', validateUrlPresets, async (req: Request, res: Response<URLPreset[] | ErrorResponse>) => {
  try {
    const newPresets: URLPreset[] = req.body.map((preset: URLPreset) => ({
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
});
