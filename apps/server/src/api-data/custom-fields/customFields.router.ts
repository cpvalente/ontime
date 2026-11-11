import express from 'express';
import type { Request, Response, Router } from 'express';
import { CustomField, ProjectCustomFields } from 'ontime-types';

import { getProjectCustomFieldsWithOrder } from '../rundown/rundown.dao.js';
import {
  createCustomField,
  deleteCustomField,
  editCustomField,
  reorderCustomFields,
} from '../rundown/rundown.service.js';
import {
  validateCustomField,
  validateDeleteCustomField,
  validateEditCustomField,
  validateReorderCustomFields,
} from './customFields.validation.js';

export const router: Router = express.Router();

/**
 * Gets all the custom fields for the project with their order
 */
router.get('/', (_req: Request, res: Response<ProjectCustomFields>) => {
  res.status(200).json(getProjectCustomFieldsWithOrder());
});

/**
 * Creates a new custom field
 */
router.post('/', validateCustomField, async (req: Request, res: Response<ProjectCustomFields>) => {
  await createCustomField(req.body as CustomField);
  res.status(201).json(getProjectCustomFieldsWithOrder());
});

/**
 * Sets the order of the custom fields
 */
router.patch('/order', validateReorderCustomFields, async (req: Request, res: Response<ProjectCustomFields>) => {
  await reorderCustomFields(req.body.order);
  res.status(200).json(getProjectCustomFieldsWithOrder());
});

/**
 * Modifies the properties of an existing custom field
 */
router.put('/:key', validateEditCustomField, async (req: Request, res: Response<ProjectCustomFields>) => {
  const currentKey = req.params.key;
  const { colour, type, label } = req.body;

  await editCustomField(currentKey, { label, colour, type });
  res.status(200).json(getProjectCustomFieldsWithOrder());
});

/**
 * Deletes an existing custom field
 */
router.delete('/:key', validateDeleteCustomField, async (req: Request, res: Response<ProjectCustomFields>) => {
  await deleteCustomField(req.params.key);
  res.status(200).json(getProjectCustomFieldsWithOrder());
});
