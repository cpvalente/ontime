import express from 'express';
import { clearReport, getReport } from './report.controller.js';

export const router = express.Router();

//TODO: add validation ?
router.get('/report', getReport);
router.delete('/report/:eventId', clearReport);
router.delete('/report', clearReport);
