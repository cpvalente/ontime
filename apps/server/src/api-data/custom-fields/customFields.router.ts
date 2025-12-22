import { CustomField, CustomFields, ErrorResponse } from 'ontime-types';
import { getErrorMessage } from 'ontime-utils';

import express from 'express';
import type { Request, Response } from 'express';

import { getDataProvider } from '../../classes/data-provider/DataProvider.js';

import { getProjectCustomFields } from '../rundown/rundown.dao.js';
import { createCustomField, editCustomField, deleteCustomField } from '../rundown/rundown.service.js';

import { validateCustomField, validateDeleteCustomField, validateEditCustomField } from './customFields.validation.js';

export const router = express.Router();

/**
 * Gets all the custom fields for the project
 */
router.get('/', async (_req: Request, res: Response<CustomFields>) => {
  const customFields = getProjectCustomFields();
  res.status(200).json(customFields);
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
 * Modifies the properties of an existing custom field
 */
router.put('/:key', validateEditCustomField, async (req: Request, res: Response<CustomFields | ErrorResponse>) => {
  try {
    const currentKey = req.params.key;
    const { colour, type, label, tts } = req.body;

    const projectRundowns = getDataProvider().getProjectRundowns();
    const newFields = await editCustomField(currentKey, { label, colour, type, tts }, projectRundowns);
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
    const projectRundowns = getDataProvider().getProjectRundowns();
    const customFields = await deleteCustomField(req.params.key, projectRundowns);
    res.status(200).json(customFields);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});
