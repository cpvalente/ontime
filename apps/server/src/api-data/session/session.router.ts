import express from 'express';

import { getInfo, getSessionStats, generateUrl } from './session.controller.js';
import { validateGenerateUrl } from './session.validation.js';

export const router = express.Router();

router.get('/', getSessionStats);
router.get('/info', getInfo);
router.post('/url', validateGenerateUrl, generateUrl);
