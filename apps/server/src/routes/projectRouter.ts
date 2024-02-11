import express from 'express';
import {
  deleteCustomField,
  getCustomFields,
  getProject,
  postCustomField,
  postProject,
  putCustomField,
} from '../controllers/projectController.js';
import { projectSanitiser } from '../controllers/projectController.validate.js';

export const router = express.Router();

// create route between controller and 'GET /project' endpoint
router.get('/', getProject);

// create route between controller and 'POST /project' endpoint
router.post('/', projectSanitiser, postProject);

router.get('/custom-field', getCustomFields);

//TODO: validate
router.post('/custom-field', postCustomField);

router.put('/custom-field', putCustomField);

router.delete('/custom-field/:label', deleteCustomField);
