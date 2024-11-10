import express from 'express';

import { getInfo, getSessionStats } from './session.controller.js';

export const router = express.Router();

router.get('/', getSessionStats);
router.get('/info', getInfo);
