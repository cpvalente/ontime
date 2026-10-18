import express from 'express';
import type { Request, Response, Router } from 'express';
import { CustomField, CustomFields, ErrorResponse, ProjectCustomFields } from 'ontime-types';
import { getErrorMessage } from 'ontime-utils';

import { getProjectCustomFields, getProjectCustomFieldsWithOrder } from '../rundown/rundown.dao.js';
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
 * Gets all the custom fields for the project
 */
router.get('/', (_req: Request, res: Response<CustomFields>) => {
  const customFields = getProjectCustomFields();
  res.status(200).json(customFields);
});

/**
 * Gets all the custom fields for the project with their order
 */
router.get('/ordered', (_req: Request, res: Response<ProjectCustomFields>) => {
  res.status(200).json(getProjectCustomFieldsWithOrder());
});

/**
 * Creates a new custom field
 */
router.post('/', validateCustomField, async (req: Request, res: Response<CustomFields | ErrorResponse>) => {
  try {
    const newFields = await createCustomField(req.body as CustomField);
    res.status(201).json(newFields);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});

/**
 * Sets the order of the custom fields
 */
router.patch(
  '/order',
  validateReorderCustomFields,
  async (req: Request, res: Response<ProjectCustomFields | ErrorResponse>) => {
    try {
      await reorderCustomFields(req.body.order);
      res.status(200).json(getProjectCustomFieldsWithOrder());
    } catch (error) {
      const message = getErrorMessage(error);
      res.status(400).send({ message });
    }
  },
);

/**
 * Modifies the properties of an existing custom field
 */
router.put('/:key', validateEditCustomField, async (req: Request, res: Response<CustomFields | ErrorResponse>) => {
  try {
    const currentKey = req.params.key;
    const { colour, type, label } = req.body;

    const newFields = await editCustomField(currentKey, { label, colour, type });
    res.status(200).json(newFields);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});

/**
 * Deletes an existing custom field
 */
router.delete('/:key', validateDeleteCustomField, async (req: Request, res: Response<CustomFields | ErrorResponse>) => {
  try {
    const customFields = await deleteCustomField(req.params.key);
    res.status(200).json(customFields);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});
