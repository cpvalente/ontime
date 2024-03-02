import express from 'express';
import { getAliases, postAliases } from './aliases.controller.js';
import { validateAliases } from './aliases.validation.js';

export const router = express.Router();

router.get('/aliases', getAliases);
router.post('/aliases', validateAliases, postAliases);
