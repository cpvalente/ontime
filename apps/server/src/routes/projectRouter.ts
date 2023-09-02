import express from 'express';
import { getProject, postProject } from '../controllers/projectController.js';
import { projectSanitiser } from '../controllers/projectController.validate.js';

export const router = express.Router();

// create route between controller and 'GET /project' endpoint
router.get('/', getProject);

// create route between controller and 'POST /project' endpoint
router.post('/', projectSanitiser, postProject);
