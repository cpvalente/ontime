import { CustomField, ErrorResponse } from 'ontime-types';
import { getErrorMessage } from 'ontime-utils';

import express from 'express';
import type { Request, Response } from 'express';

import { getProjectCustomFields, CustomFieldWithKey } from '../rundown/rundown.dao.js';
import { createCustomField, editCustomField, deleteCustomField } from '../rundown/rundown.service.js';

import { validateCustomField, validateDeleteCustomField, validateEditCustomField } from './customFields.validation.js';

export const router = express.Router();

// Response type changed to CustomFieldWithKey[]
router.get('/', async (_req: Request, res: Response<CustomFieldWithKey[]>) => {
  const customFieldsArray = getProjectCustomFields();
  res.status(200).json(customFieldsArray);
});

// The POST, PUT, DELETE operations in this router return the entire updated CustomFields object.
// This will also need to change to return the sorted array if we want consistency.
router.post('/', validateCustomField, async (req: Request, res: Response<CustomFieldWithKey[] | ErrorResponse>) => {
  try {
    // req.body will include label, type, colour, and optionally order
    const newFieldsArray = await createCustomField(req.body as CustomField);
    res.status(201).send(newFieldsArray);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});

router.put('/:key', validateEditCustomField, async (req: Request, res: Response<CustomFieldWithKey[] | ErrorResponse>) => {
  try {
    const currentKey = req.params.key;
    const { colour, type, label, order } = req.body; // order is now included
    const newFieldsArray = await editCustomField(currentKey, { label, colour, type, order });
    res.status(200).send(newFieldsArray);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});

router.delete('/:key', validateDeleteCustomField, async (req: Request, res: Response<CustomFieldWithKey[] | ErrorResponse>) => {
  try {
    const customFieldsArray = await deleteCustomField(req.params.key);
    res.status(200).send(customFieldsArray);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});
