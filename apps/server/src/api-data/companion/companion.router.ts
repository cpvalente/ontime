import express from 'express';
import { getCompanion, postCompanion } from './companion.controller.js';
import { validateCompanion } from './companion.validation.js';

export const router = express.Router();

router.get('/', getCompanion);
router.post('/', validateCompanion, postCompanion);
