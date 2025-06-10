import { CustomField, CustomFields, ErrorResponse } from 'ontime-types';
import { getErrorMessage } from 'ontime-utils';

import express from 'express';
import type { Request, Response } from 'express';

import { getProjectCustomFields } from '../rundown/rundown.dao.js';
import { createCustomField, editCustomField, deleteCustomField } from '../rundown/rundown.service.js';

import { validateCustomField, validateDeleteCustomField, validateEditCustomField } from './customFields.validation.js';

export const router = express.Router();

router.get('/', async (_req: Request, res: Response<CustomFields>) => {
  const customFields = getProjectCustomFields();
  res.status(200).json(customFields);
});

router.post('/', validateCustomField, async (req: Request, res: Response<CustomFields | ErrorResponse>) => {
  try {
    const newFields = await createCustomField(req.body as CustomField);
    res.status(201).send(newFields);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});

router.put('/:key', validateEditCustomField, async (req: Request, res: Response<CustomFields | ErrorResponse>) => {
  try {
    const currentKey = req.params.key;
    const { colour, type, label } = req.body;
    const newFields = await editCustomField(currentKey, { label, colour, type });
    res.status(200).send(newFields);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});

router.delete('/:key', validateDeleteCustomField, async (req: Request, res: Response<CustomFields | ErrorResponse>) => {
  try {
    const customFields = await deleteCustomField(req.params.key);
    res.status(200).send(customFields);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});
