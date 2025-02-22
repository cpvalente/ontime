import express from 'express';
import { getSettings, postOffsetMode, postSettings, postWelcomeDialog } from './settings.controller.js';
import { validateOffsetMode, validateSettings, validateWelcomeDialog } from './settings.validation.js';

export const router = express.Router();

router.post('/welcomedialog', validateWelcomeDialog, postWelcomeDialog);
router.post('/offsetmode', validateOffsetMode, postOffsetMode);

router.get('/', getSettings);
router.post('/', validateSettings, postSettings);
