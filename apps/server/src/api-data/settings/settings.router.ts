import express from 'express';
import { getSettings, postSettings } from './settings.controller.js';
import { validateSettings } from './settings.validation.js';

export const router = express.Router();

router.get('/settings', getSettings);
router.post('/settings', validateSettings, postSettings);
