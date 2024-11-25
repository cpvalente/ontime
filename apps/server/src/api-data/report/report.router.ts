import express from 'express';
import { clearReport, getReport } from './report.controller.js';
import { paramsMustHaveEventId } from './report.validation.js';

export const router = express.Router();

router.get('/', getReport);
router.delete('/:eventId', paramsMustHaveEventId, clearReport);
router.delete('', clearReport);
