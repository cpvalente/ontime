import express from 'express';
import { getOSC, postOSC } from './osc.controller.js';
import { validateOSC } from './osc.validation.js';

export const router = express.Router();

router.get('/osc', getOSC);
router.post('/osc', validateOSC, postOSC);
