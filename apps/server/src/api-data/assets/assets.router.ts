import express from 'express';
import { getCssOverride, postCssOverride, restoreCss } from './assets.controller.js';

export const router = express.Router();

router.get('/css', getCssOverride);
router.post('/css', postCssOverride);
router.post('/css/restore', restoreCss);
