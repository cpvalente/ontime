import express from 'express';

import { deleteProjectLogo, getProjectData, postProjectData } from './project.controller.js';
import { projectSanitiser } from './project.validation.js';
import { uploadImageFile } from '../db/db.middleware.js';
import { postProjectLogo } from '../db/db.controller.js';
import { publicDir } from '../../setup/index.js';

export const router = express.Router();

router.get('/', getProjectData);
router.post('/', projectSanitiser, postProjectData);
router.post('/upload', uploadImageFile, postProjectLogo);
router.use('/logos', express.static(publicDir.logoDir));
router.delete('/logos', deleteProjectLogo);
