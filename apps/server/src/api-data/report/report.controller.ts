import type { Request, Response } from 'express';
import type { OntimeReport } from 'ontime-types';
import * as report from './report.service.js';

export async function getAll(_req: Request, res: Response<OntimeReport>) {
  res.json(report.generate());
}

