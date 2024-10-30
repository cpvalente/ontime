import express from 'express';

import { getProjectData, postProjectData } from './project.controller.js';
import { projectSanitiser } from './project.validation.js';
import { uploadImageFile } from '../db/db.middleware.js';
import { postProjectImage } from '../db/db.controller.js';
import { publicDir } from '../../setup/index.js';

export const router = express.Router();

router.get('/', getProjectData);
router.post('/', projectSanitiser, postProjectData);
router.post('/upload', uploadImageFile, postProjectImage);
router.use('/logos', express.static(publicDir.logoDir));
