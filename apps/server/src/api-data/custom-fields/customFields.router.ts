import express from 'express';
import type { Request, Response, Router } from 'express';
import { CustomField, CustomFields } from 'ontime-types';

import { getProjectCustomFields } from '../rundown/rundown.dao.js';
import { createCustomField, deleteCustomField, editCustomField } from '../rundown/rundown.service.js';
import { validateCustomField, validateDeleteCustomField, validateEditCustomField } from './customFields.validation.js';

export const router: Router = express.Router();

/**
 * Gets all the custom fields for the project
 */
router.get('/', (_req: Request, res: Response<CustomFields>) => {
  const customFields = getProjectCustomFields();
  res.status(200).json(customFields);
});

/**
 * Creates a new custom field
 */
router.post('/', validateCustomField, async (req: Request, res: Response<CustomFields>) => {
  const newFields = await createCustomField(req.body as CustomField);
  res.status(201).json(newFields);
});

/**
 * Modifies the properties of an existing custom field
 */
router.put('/:key', validateEditCustomField, async (req: Request, res: Response<CustomFields>) => {
  const currentKey = req.params.key;
  const { colour, type, label } = req.body;

  const newFields = await editCustomField(currentKey, { label, colour, type });
  res.status(200).json(newFields);
});

/**
 * Deletes an existing custom field
 */
router.delete('/:key', validateDeleteCustomField, async (req: Request, res: Response<CustomFields>) => {
  const customFields = await deleteCustomField(req.params.key);
  res.status(200).json(customFields);
});
