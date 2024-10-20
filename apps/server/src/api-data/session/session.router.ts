import express from 'express';

import { getInfo } from './session.controller.js';

export const router = express.Router();

router.get('/info', getInfo);
