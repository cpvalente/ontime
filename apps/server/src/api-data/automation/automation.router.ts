import express from 'express';

import {
  deleteTrigger,
  deleteAutomation,
  editAutomation,
  getAutomationSettings,
  postTrigger,
  postAutomation,
  putTrigger,
  postAutomationSettings,
  testOutput,
} from './automation.controller.js';
import {
  validateAutomationSettings,
  validateAutomation,
  validateAutomationPatch,
  validateTestPayload,
  validateTrigger,
  validateTriggerPatch,
} from './automation.validation.js';
import { paramsWithId } from '../validation-utils/validationFunction.js';

export const router = express.Router();

/**
 * @swagger
 * /data/automations:
 *   get:
 *     summary: Get automation settings
 *     responses:
 *       200:
 *         description: The automation settings
 *   post:
 *     summary: Update automation settings
 *     responses:
 *       204:
 *         description: Successfully updated
 */
router.get('/', getAutomationSettings);
router.post('/', validateAutomationSettings, postAutomationSettings);

/**
 * @swagger
 * /data/automations/trigger:
 *   post:
 *     summary: Create a new trigger
 *     responses:
 *       201:
 *         description: Successfully created
 */
router.post('/trigger', validateTrigger, postTrigger);

/**
 * @swagger
 * /data/automations/trigger/{id}:
 *   put:
 *     summary: Update a trigger
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Successfully updated
 *   delete:
 *     summary: Delete a trigger
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Successfully deleted
 */
router.put('/trigger/:id', validateTriggerPatch, putTrigger);
router.delete('/trigger/:id', paramsWithId, deleteTrigger);

/**
 * @swagger
 * /data/automations/automation:
 *   post:
 *     summary: Create a new automation
 *     responses:
 *       201:
 *         description: Successfully created
 */
router.post('/automation', validateAutomation, postAutomation);

/**
 * @swagger
 * /data/automations/automation/{id}:
 *   put:
 *     summary: Update an automation
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Successfully updated
 *   delete:
 *     summary: Delete an automation
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Successfully deleted
 */
router.put('/automation/:id', validateAutomationPatch, editAutomation);
router.delete('/automation/:id', paramsWithId, deleteAutomation);

/**
 * @swagger
 * /data/automations/test:
 *   post:
 *     summary: Test an automation output
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/test', validateTestPayload, testOutput);
