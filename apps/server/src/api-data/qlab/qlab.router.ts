import express from 'express';
import { getQlabSettings, postQlabSettings } from './qlab.controller.js';
import { validateQlabSettings } from './qlab.validation.js';

export const router = express.Router();

router.get('/', getQlabSettings);
router.post('/', validateQlabSettings, postQlabSettings);
