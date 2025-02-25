import express from 'express';
import { getSettings, postSettings, postWelcomeDialog } from './settings.controller.js';
import { validateSettings, validateWelcomeDialog } from './settings.validation.js';

export const router = express.Router();

router.post('/welcomedialog', validateWelcomeDialog, postWelcomeDialog);

router.get('/', getSettings);
router.post('/', validateSettings, postSettings);
