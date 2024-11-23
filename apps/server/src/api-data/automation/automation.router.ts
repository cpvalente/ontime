import express from 'express';

import {
  deleteAutomation,
  deleteBlueprint,
  editBlueprint,
  getAutomationSettings,
  postAutomation,
  postBlueprint,
  putAutomation,
  postAutomationSettings,
  testOutput,
} from './automation.controller.js';
import {
  paramContainsId,
  validateAutomation,
  validateAutomationPatch,
  validateAutomationSettings,
  validateBlueprint,
  validateBlueprintPatch,
  validateTestPayload,
} from './automation.validation.js';

export const router = express.Router();

router.get('/', getAutomationSettings);
router.post('/', validateAutomationSettings, postAutomationSettings);

router.post('/automation', validateAutomation, postAutomation);
router.put('/automation/:id', validateAutomationPatch, putAutomation);
router.delete('/automation/:id', paramContainsId, deleteAutomation);

router.post('/blueprint', validateBlueprint, postBlueprint);
router.put('/blueprint/:id', validateBlueprintPatch, editBlueprint);
router.delete('/blueprint/:id', paramContainsId, deleteBlueprint);

router.post('/test', validateTestPayload, testOutput);
