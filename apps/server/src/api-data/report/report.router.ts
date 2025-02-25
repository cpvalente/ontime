import express from 'express';
import { getAll, deleteWithId, deleteAll } from './report.controller.js';
import { paramsMustHaveEventId } from '../rundown/rundown.validation.js';

export const router = express.Router();

router.get('/', getAll);

router.delete('/all', deleteAll);
router.delete('/:eventId', paramsMustHaveEventId, deleteWithId);
