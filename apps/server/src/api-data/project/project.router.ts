import express from 'express';

import { getProjectData, postProjectData } from './project.controller.js';
import { projectSanitiser } from './project.validation.js';

export const router = express.Router();

router.get('/', getProjectData);
router.post('/', projectSanitiser, postProjectData);
