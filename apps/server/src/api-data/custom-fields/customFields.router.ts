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
 * @swagger
 * /data/custom-fields:
 *   get:
 *     summary: Get all custom fields for the project
 *     responses:
 *       200:
 *         description: A list of custom fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 customFields:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get('/', async (_req: Request, res: Response<CustomFields>) => {
  const customFields = getProjectCustomFields();
  res.status(200).json(customFields);
});

/**
 * @swagger
 * /data/custom-fields:
 *   post:
 *     summary: Create a new custom field
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: The updated list of custom fields
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
 * @swagger
 * /data/custom-fields/{key}:
 *   put:
 *     summary: Update a custom field
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: The updated list of custom fields
 */
router.put('/:key', validateEditCustomField, async (req: Request, res: Response<CustomFields | ErrorResponse>) => {
  try {
    const currentKey = req.params.key;
    const { colour, type, label } = req.body;

    const projectRundowns = getDataProvider().getProjectRundowns();
    const newFields = await editCustomField(currentKey, { label, colour, type }, projectRundowns);
    res.status(200).json(newFields);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});

/**
 * @swagger
 * /data/custom-fields/{key}:
 *   delete:
 *     summary: Delete a custom field
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The updated list of custom fields
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
