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
  paramContainsId,
  validateAutomationSettings,
  validateAutomation,
  validateAutomationPatch,
  validateTestPayload,
  validateTrigger,
  validateTriggerPatch,
} from './automation.validation.js';

export const router = express.Router();

router.get('/', getAutomationSettings);
router.post('/', validateAutomationSettings, postAutomationSettings);

router.post('/trigger', validateTrigger, postTrigger);
router.put('/trigger/:id', validateTriggerPatch, putTrigger);
router.delete('/trigger/:id', paramContainsId, deleteTrigger);

router.post('/automation', validateAutomation, postAutomation);
router.put('/automation/:id', validateAutomationPatch, editAutomation);
router.delete('/automation/:id', paramContainsId, deleteAutomation);

router.post('/test', validateTestPayload, testOutput);
