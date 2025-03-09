import type { Request, Response } from 'express';
import type { OntimeReport } from 'ontime-types';
import * as report from './report.service.js';

export function getAll(_req: Request, res: Response<OntimeReport>) {
  res.status(200).json(report.generate());
}

export function deleteAll(_req: Request, res: Response<OntimeReport>) {
  report.clear();
  res.status(200).send();
}

export function deleteWithId(req: Request, res: Response<OntimeReport>) {
  const { eventId } = req.params;
  report.clear(eventId);
  res.status(200).send();
}
