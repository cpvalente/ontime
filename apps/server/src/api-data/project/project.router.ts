import express from 'express';

import { getProjectData, postProjectData } from './project.controller.js';
import { projectSanitiser } from './project.validation.js';
import { uploadImageFile } from '../db/db.middleware.js';
import { postProjectLogo } from '../db/db.controller.js';

export const router = express.Router();

router.get('/', getProjectData);
router.post('/', projectSanitiser, postProjectData);
router.post('/upload', uploadImageFile, postProjectLogo);
