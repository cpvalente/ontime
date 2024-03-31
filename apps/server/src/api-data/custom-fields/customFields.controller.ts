import { CustomField, CustomFields } from 'ontime-types';

import type { Request, Response } from 'express';

import {
  createCustomField,
  editCustomField,
  getCustomFields as getCustomFieldsFromCache,
  removeCustomField,
} from '../../services/rundown-service/rundownCache.js';

export async function getCustomFields(_req: Request, res: Response<CustomFields>) {
  const customFields = getCustomFieldsFromCache();
  res.json(customFields);
}

// Expects { label: <label> type: 'string | ..' }
export async function postCustomField(req: Request, res: Response) {
  try {
    const newField = req.body as CustomField;
    const allFields = await createCustomField(newField);
    res.status(201).send(allFields);
  } catch (error) {
    res.status(400).send({ message: error.toString() });
  }
}

// Expects { label: <oldLabel>, field: { label: <newLabel> type: 'string | ..' } }
export async function putCustomField(req: Request, res: Response) {
  try {
    const oldLabel = req.params.label;
    const { colour, type, label } = req.body;
    const newFields = await editCustomField(oldLabel, { label, colour, type });
    res.status(200).send(newFields);
  } catch (error) {
    res.status(400).send({ message: error.toString() });
  }
}

// Expects { label: <label> }
export async function deleteCustomField(req: Request, res: Response) {
  try {
    const fieldToDelete = req.params.label;
    await removeCustomField(fieldToDelete);
    res.sendStatus(204);
  } catch (error) {
    res.status(400).send({ message: error.toString() });
  }
}
