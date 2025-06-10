import express from 'express';
import { getAll, deleteWithId, deleteAll } from './report.controller.js';
import { paramsWithId } from '../validation-utils/validationFunction.js';

export const router = express.Router();

router.get('/', getAll);

router.delete('/all', deleteAll);
router.delete('/:id', paramsWithId, deleteWithId);
