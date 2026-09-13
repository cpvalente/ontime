import express, { Router } from 'express';

import { paramsWithId } from '../validation-utils/validationFunction.js';
import {
  deleteAutomation,
  deleteTrigger,
  editAutomation,
  getAutomationSettings,
  getAutomationUsageCounts,
  postAutomationComposition,
  postAutomation,
  postAutomationSettings,
  postTrigger,
  putTrigger,
  testOutput,
} from './automation.controller.js';
import {
  validateAutomation,
  validateAutomationComposition,
  validateAutomationPatch,
  validateAutomationSettings,
  validateTestPayload,
  validateTrigger,
  validateTriggerPatch,
} from './automation.validation.js';

export const router: Router = express.Router();

router.get('/', getAutomationSettings);
router.get('/usage', getAutomationUsageCounts);
router.post('/', validateAutomationSettings, postAutomationSettings);

router.post('/trigger', validateTrigger, postTrigger);
router.put('/trigger/:id', validateTriggerPatch, putTrigger);
router.delete('/trigger/:id', paramsWithId, deleteTrigger);

router.post('/automation', validateAutomation, postAutomation);
router.post('/composition', validateAutomationComposition, postAutomationComposition);
router.put('/automation/:id', validateAutomationPatch, editAutomation);
router.delete('/automation/:id', paramsWithId, deleteAutomation);

router.post('/test', validateTestPayload, testOutput);
