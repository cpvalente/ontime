import type { Request, Response, RequestHandler } from 'express';

import { CustomField, CustomFields, ProjectData } from 'ontime-types';

import { removeUndefined } from '../utils/parserUtils.js';
import { failEmptyObjects } from '../utils/routerUtils.js';
import { DataProvider } from '../classes/data-provider/DataProvider.js';
import { createCustomField, editCustomField, removeCustomField } from '../utils/customFields.js';

// Create controller for GET request to 'project'
export const getProject: RequestHandler = async (req, res) => {
  res.json(DataProvider.getProjectData());
};

// Create controller for POST request to 'project'
export const postProject: RequestHandler = async (req, res) => {
  if (failEmptyObjects(req.body, res)) {
    return;
  }

  try {
    const newEvent: Partial<ProjectData> = removeUndefined({
      title: req.body?.title,
      description: req.body?.description,
      publicUrl: req.body?.publicUrl,
      publicInfo: req.body?.publicInfo,
      backstageUrl: req.body?.backstageUrl,
      backstageInfo: req.body?.backstageInfo,
      endMessage: req.body?.endMessage,
    });
    const newData = await DataProvider.setProjectData(newEvent);
    res.status(200).send(newData);
  } catch (error) {
    res.status(400).send({ message: error.toString() });
  }
};

export const getCustomFields: RequestHandler = async (_req: Request, res: Response<CustomFields>) => {
  res.json(DataProvider.getCustomFields());
};

// Expects { label: <label> type: 'string | ..' }
export const postCustomField: RequestHandler = async (req: Request, res: Response) => {
  try {
    const newField = req.body as CustomField;
    const allFields = await createCustomField(newField);
    res.status(201).send(allFields);
  } catch (error) {
    res.status(400).send({ message: error.toString() });
  }
};

// Expects { label: <oldLabel>, field: { label: <newLabel> type: 'string | ..' } }
export const putCustomField: RequestHandler = async (req: Request, res: Response) => {
  try {
    const oldLabel = req.params.label;
    const { colour, type, label } = req.body;
    const newFields = await editCustomField(oldLabel, { label, colour, type });
    res.status(200).send(newFields);
  } catch (error) {
    res.status(400).send({ message: error.toString() });
  }
};

// Expects { label: <label> }
export const deleteCustomField: RequestHandler = async (req: Request, res: Response) => {
  try {
    const fieldToDelete = req.params.label;
    await removeCustomField(fieldToDelete);
    res.sendStatus(204);
  } catch (error) {
    res.status(400).send({ message: error.toString() });
  }
};
