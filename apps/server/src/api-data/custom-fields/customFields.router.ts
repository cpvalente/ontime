import express from 'express';

import { deleteCustomField, getCustomFields, postCustomField, putCustomField } from './customFields.controller.js';
import { validateCustomField, validateDeleteCustomField, validateEditCustomField } from './customFields.validation.js';

export const router = express.Router();

router.get('/', getCustomFields);

router.post('/', validateCustomField, postCustomField);

router.put('/:label', validateEditCustomField, putCustomField);

router.delete('/:label', validateDeleteCustomField, deleteCustomField);
