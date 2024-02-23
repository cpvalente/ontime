import express from 'express';

import {
  deleteCustomField,
  getCustomFields,
  getProject,
  postCustomField,
  postProject,
  putCustomField,
} from '../controllers/projectController.js';
import {
  projectSanitiser,
  validateCustomField,
  validateDeleteCustomField,
  validateEditCustomField,
} from '../controllers/projectController.validate.js';

export const router = express.Router();

// create route between controller and 'GET /project' endpoint
router.get('/', getProject);

// create route between controller and 'POST /project' endpoint
router.post('/', projectSanitiser, postProject);

router.get('/custom-field', getCustomFields);

router.post('/custom-field', validateCustomField, postCustomField);

router.put('/custom-field/:label', validateEditCustomField, putCustomField);

router.delete('/custom-field/:label', validateDeleteCustomField, deleteCustomField);
