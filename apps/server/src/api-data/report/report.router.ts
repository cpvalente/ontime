import express from 'express';
import { clearReport, getReport } from './report.controller.js';

export const router = express.Router();

//TODO: add validation ?
router.get('/', getReport);
router.delete('/:eventId', clearReport);
router.delete('', clearReport);
