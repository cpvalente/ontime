import { OntimeReport } from 'ontime-types';
import { Request, Response } from 'express';
import * as report from '../../services/report-service/ReportService.js';

export async function getReport(_req: Request, res: Response<OntimeReport>) {
  res.json(report.generate());
}

export async function clearReport(req: Request, res: Response<OntimeReport>) {
  report.clear(req.params?.eventId);
  res.json(report.generate());
}
