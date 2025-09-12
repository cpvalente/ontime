import express from 'express';
import type { Request, Response } from 'express';
import { RefetchKey, type ErrorResponse, type URLPreset } from 'ontime-types';
import { getErrorMessage } from 'ontime-utils';
import { getDataProvider } from '../../classes/data-provider/DataProvider.js';
import { validateNewPreset, validatePresetParam, validateUpdatePreset } from './urlPresets.validation.js';
import { sendRefetch } from '../../adapters/WebsocketAdapter.js';

export const router = express.Router();

router.get('/', (_req: Request, res: Response<URLPreset[]>) => {
  const presets = getDataProvider().getUrlPresets();
  res.status(200).send(presets as URLPreset[]);
});

router.post('/', validateNewPreset, async (req: Request, res: Response<URLPreset[] | ErrorResponse>) => {
  try {
    const newPreset: URLPreset = {
      enabled: req.body.enabled,
      alias: req.body.alias,
      target: req.body.target,
      search: req.body.search,
      options: req.body.options,
    };

    const currentPresets = getDataProvider().getUrlPresets();
    if (currentPresets.some((preset) => preset.alias === newPreset.alias)) {
      throw new Error(`Preset with alias ${newPreset.alias} already exists.`);
    }

    const newPresets = [...currentPresets, newPreset];

    // Update the URL presets in the data provider
    await getDataProvider().setUrlPresets(newPresets);
    sendRefetch(RefetchKey.UrlPresets);
    res.status(201).send(newPresets);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});

router.put('/:alias', validateUpdatePreset, async (req: Request, res: Response<URLPreset[] | ErrorResponse>) => {
  try {
    const alias = req.params.alias;
    const updatedPreset: URLPreset = {
      enabled: req.body.enabled,
      alias: req.body.alias,
      target: req.body.target,
      search: req.body.search,
    };

    if (alias !== updatedPreset.alias) {
      throw new Error('Changing alias is not permitted');
    }

    const currentPresets = getDataProvider().getUrlPresets();
    const newPresets = currentPresets.map((preset) => (preset.alias === alias ? updatedPreset : preset));

    // Update the URL presets in the data provider
    await getDataProvider().setUrlPresets(newPresets);
    sendRefetch(RefetchKey.UrlPresets);
    res.status(200).send(newPresets);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});

router.delete('/:alias', validatePresetParam, async (req: Request, res: Response<URLPreset[] | ErrorResponse>) => {
  try {
    const alias = req.params.alias;
    const currentPresets = getDataProvider().getUrlPresets();
    const newPresets = currentPresets.filter((preset) => preset.alias !== alias);

    // Update the URL presets in the data provider
    await getDataProvider().setUrlPresets(newPresets);
    sendRefetch(RefetchKey.UrlPresets);
    res.status(200).send(newPresets);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});
