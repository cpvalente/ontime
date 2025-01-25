import express from 'express';
import { getAll, deleteWithId } from './report.controller.js';
import { paramsMustHaveEventId } from '../rundown/rundown.validation.js';

export const router = express.Router();

router.get('/', getAll);

router.delete('/:eventId', paramsMustHaveEventId, deleteWithId);
