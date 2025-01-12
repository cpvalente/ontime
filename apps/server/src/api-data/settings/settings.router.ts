import express from 'express';
import { getSettings, postSettings, getWelcomeDialog } from './settings.controller.js';
import { validateSettings } from './settings.validation.js';

export const router = express.Router();

router.get('/welcomedialog', getWelcomeDialog);

router.get('/', getSettings);
router.post('/', validateSettings, postSettings);
