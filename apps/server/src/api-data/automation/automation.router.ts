import express from 'express';

import {
  deleteAutomation,
  getAutomations,
  postAutomation,
  putAutomation,
  testAutomation,
} from './automation.controller.js';
import { paramContainsAutomationId, validateAutomation, validateTestPayload } from './automation.validation.js';

export const router = express.Router();

router.get('/', getAutomations);
router.get('/test', validateTestPayload, testAutomation);

router.post('/', validateAutomation, postAutomation);

router.put('/:automationId', paramContainsAutomationId, putAutomation);

router.delete('/:automationId', paramContainsAutomationId, deleteAutomation);
