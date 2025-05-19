import express from 'express';
import { getAll, deleteWithId, deleteAll } from './report.controller.js';
import { paramsMustHaveEntryId } from '../rundown/rundown.validation.js';

export const router = express.Router();

router.get('/', getAll);

router.delete('/all', deleteAll);
router.delete('/:eventId', paramsMustHaveEntryId, deleteWithId);
