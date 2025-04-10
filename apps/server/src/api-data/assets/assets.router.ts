import express from 'express';

import { getCssOverride, postCssOverride, restoreCss } from './assets.controller.js';
import { validatePostCss } from './assets.validation.js';

export const router = express.Router();

router.get('/css', getCssOverride);
router.post('/css', validatePostCss, postCssOverride);
router.post('/css/restore', restoreCss);
