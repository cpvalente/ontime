import express from 'express';
import type { Request, Response, Router } from 'express';
import type { URLPreset } from 'ontime-types';

import * as urlPresetsDao from './urlPresets.dao.js';
import { validateNewPreset, validatePresetParam, validateUpdatePreset } from './urlPresets.validation.js';

export const router: Router = express.Router();

router.get('/', (_req: Request, res: Response<URLPreset[]>) => {
  const presets = urlPresetsDao.getUrlPresets();
  res.status(200).send(presets as URLPreset[]);
});

router.post('/', validateNewPreset, async (req: Request, res: Response<URLPreset[]>) => {
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
});

router.put('/:alias', validateUpdatePreset, async (req: Request, res: Response<URLPreset[]>) => {
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
});

router.delete('/:alias', validatePresetParam, async (req: Request, res: Response<URLPreset[]>) => {
  const newPresets = await urlPresetsDao.deleteUrlPreset(req.params.alias);
  res.status(200).send(newPresets);
});
