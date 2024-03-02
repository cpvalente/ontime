import express from 'express';

import { deleteCustomField, getCustomFields, postCustomField, putCustomField } from './customFields.controller.js';
import { validateCustomField, validateDeleteCustomField, validateEditCustomField } from './customFields.validation.js';

export const router = express.Router();

router.get('/custom-field', getCustomFields);

router.post('/custom-field', validateCustomField, postCustomField);

router.put('/custom-field/:label', validateEditCustomField, putCustomField);

router.delete('/custom-field/:label', validateDeleteCustomField, deleteCustomField);
