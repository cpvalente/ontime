import express from 'express';
import { getUrlPresets, postUrlPresets } from './urlPresets.controller.js';
import { validateUrlPresets } from './urlPresets.validation.js';

export const router = express.Router();

router.get('/', getUrlPresets);
router.post('/', validateUrlPresets, postUrlPresets);
