import express from 'express';
import type { Request, Response, Router } from 'express';
import type { ErrorResponse, URLPreset } from 'ontime-types';
import { getErrorMessage } from 'ontime-utils';

import * as urlPresetsDao from './urlPresets.dao.js';
import { validateNewPreset, validatePresetParam, validateUpdatePreset } from './urlPresets.validation.js';

export const router: Router = express.Router();

router.get('/', (_req: Request, res: Response<URLPreset[]>) => {
  const presets = urlPresetsDao.getUrlPresets();
  res.status(200).send(presets as URLPreset[]);
});

router.post('/', validateNewPreset, async (req: Request, res: Response<URLPreset[] | ErrorResponse>) => {
  try {
    const newPreset: URLPreset = {
      enabled: req.body.enabled,
      alias: req.body.alias,
      target: req.body.target,
      search: req.body.search,
      displayInNav: req.body.displayInNav,
      options: req.body.options,
    };

    const newPresets = await urlPresetsDao.addUrlPreset(newPreset);
    res.status(201).send(newPresets);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});

router.put('/:alias', validateUpdatePreset, async (req: Request, res: Response<URLPreset[] | ErrorResponse>) => {
  try {
    const updatedPreset: URLPreset = {
      enabled: req.body.enabled,
      alias: req.body.alias,
      target: req.body.target,
      search: req.body.search,
      displayInNav: req.body.displayInNav,
      options: req.body.options,
    };

    const newPresets = await urlPresetsDao.editUrlPreset(req.params.alias, updatedPreset);
    res.status(200).send(newPresets);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});

router.delete('/:alias', validatePresetParam, async (req: Request, res: Response<URLPreset[] | ErrorResponse>) => {
  try {
    const newPresets = await urlPresetsDao.deleteUrlPreset(req.params.alias);
    res.status(200).send(newPresets);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});
