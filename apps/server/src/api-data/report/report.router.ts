import express from 'express';
import type { Request, Response } from 'express';

import { paramsWithId } from '../validation-utils/validationFunction.js';
import * as report from './report.service.js';

export const router = express.Router();

router.get('/', (_req: Request, res: Response) => {
  res.status(200).json(report.generate());
});

router.delete('/all', (_req: Request, res: Response) => {
  report.clear();
  res.status(204).send();
});

router.delete('/:id', paramsWithId, (req: Request, res: Response) => {
  const { id } = req.params;
  report.clear(id);
  res.status(204).send();
});
