import type { Request, Response } from 'express';
import type { OntimeReport } from 'ontime-types';
import * as report from './report.service.js';

export async function getAll(_req: Request, res: Response<OntimeReport>) {
  res.json(report.generate());
}

export async function deleteAll(_req: Request, res: Response<OntimeReport>) {
  report.clear();
  res.status(200).send();
}

export async function deleteWithId(req: Request, res: Response<OntimeReport>) {
  const { eventId } = req.params;
  report.clear(eventId);
  res.status(200).send();
}
