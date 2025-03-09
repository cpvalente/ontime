import { CustomField, CustomFields, ErrorResponse } from 'ontime-types';

import type { Request, Response } from 'express';

import { getErrorMessage } from 'ontime-utils';
import {
  createCustomField,
  editCustomField,
  getCustomFields as getCustomFieldsFromCache,
  removeCustomField,
} from '../../services/rundown-service/rundownCache.js';

export async function getCustomFields(_req: Request, res: Response<CustomFields>) {
  const customFields = getCustomFieldsFromCache();
  res.status(200).json(customFields);
}

export async function postCustomField(req: Request, res: Response<CustomFields | ErrorResponse>) {
  try {
    const newField = req.body as CustomField;
    const allFields = await createCustomField(newField);
    res.status(201).send(allFields);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
}

export async function putCustomField(req: Request, res: Response<CustomFields | ErrorResponse>) {
  try {
    const oldLabel = req.params.label;
    const { colour, type, label } = req.body;
    const newFields = await editCustomField(oldLabel, { label, colour, type });
    res.status(200).send(newFields);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
}

// Expects { label: <label> }
export async function deleteCustomField(req: Request, res: Response<CustomFields | ErrorResponse>) {
  try {
    const fieldToDelete = req.params.label;
    await removeCustomField(fieldToDelete);
    res.sendStatus(204);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
}
