import express from 'express';
import type { Request, Response, Router } from 'express';
import { CustomFields, NewCustomField } from 'ontime-types';

import { getProjectCustomFields } from '../rundown/rundown.dao.js';
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
 * Gets the project custom fields
 */
router.get('/', (_req: Request, res: Response<Readonly<CustomFields>>) => {
  res.status(200).json(getProjectCustomFields());
});

/**
 * Creates a new custom field
 */
router.post('/', validateCustomField, async (req: Request, res: Response<Readonly<CustomFields>>) => {
  res.status(201).json(await createCustomField(req.body as NewCustomField));
});

/**
 * Sets the order of the custom fields
 */
router.patch('/order', validateReorderCustomFields, async (req: Request, res: Response<Readonly<CustomFields>>) => {
  res.status(200).json(await reorderCustomFields(req.body.order));
});

/**
 * Modifies the properties of an existing custom field
 */
router.put('/:key', validateEditCustomField, async (req: Request, res: Response<Readonly<CustomFields>>) => {
  const currentKey = req.params.key;
  const { colour, label } = req.body;

  res.status(200).json(await editCustomField(currentKey, { label, colour }));
});

/**
 * Deletes an existing custom field
 */
router.delete('/:key', validateDeleteCustomField, async (req: Request, res: Response<Readonly<CustomFields>>) => {
  res.status(200).json(await deleteCustomField(req.params.key));
});
