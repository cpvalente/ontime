import express from 'express';

import { validateViewSettings } from './viewSettings.validation.js';
import { getViewSettings, postViewSettings } from './viewSettings.controller.js';

export const router = express.Router();

router.get('/views', getViewSettings);
router.post('/views', validateViewSettings, postViewSettings);
