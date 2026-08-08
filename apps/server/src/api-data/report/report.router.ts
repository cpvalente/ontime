import express from 'express';
import type { Request, Response, Router } from 'express';

import { paramsWithId } from '../validation-utils/validationFunction.js';
import * as report from './report.service.js';
import { validateRundownIdQuery, validateRunLabel } from './report.validation.js';

export const router: Router = express.Router();

/**
 * Current run's report, kept unchanged so existing HTTP automations and the
 * Companion module are unaffected.
 */
router.get('/', (_req: Request, res: Response) => {
  res.status(200).json(report.generate());
});

/**
 * Run history, most recent first. `?rundownId=` scopes the list to one rundown.
 */
router.get('/runs', validateRundownIdQuery, (req: Request, res: Response) => {
  const { rundownId } = req.query as { rundownId?: string };
  res.status(200).json(report.listRuns(rundownId));
});

/**
 * Most recently closed run, used to compare a rundown against its last outing.
 * Registered ahead of /runs/:id so "latest" is not read as an id.
 */
router.get('/runs/latest', validateRundownIdQuery, (req: Request, res: Response) => {
  const { rundownId } = req.query as { rundownId?: string };
  const run = report.getLatestRun(rundownId);
  if (!run) {
    res.status(404).send();
    return;
  }
  res.status(200).json(run);
});

router.get('/runs/:id', paramsWithId, (req: Request, res: Response) => {
  const { id } = req.params;
  const run = report.getRun(id);
  if (!run) {
    res.status(404).send();
    return;
  }
  res.status(200).json(run);
});

/**
 * Renames a run, the only field a user can edit after the fact.
 */
router.patch('/runs/:id', validateRunLabel, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { label } = req.body as { label: string };
  const run = await report.renameRun(id, label);
  if (!run) {
    res.status(404).send();
    return;
  }
  res.status(200).json(run);
});

/**
 * Deletes a single run, eg: a test run that should not pollute the history.
 */
router.delete('/runs/:id', paramsWithId, async (req: Request, res: Response) => {
  const { id } = req.params;
  const didDelete = await report.deleteRun(id);
  if (!didDelete) {
    res.status(404).send();
    return;
  }
  res.status(204).send();
});

router.delete('/all', async (_req: Request, res: Response) => {
  // clears both the run history and the report of the run in progress
  await report.deleteAllRuns();
  res.status(204).send();
});

router.delete('/:id', paramsWithId, (req: Request, res: Response) => {
  const { id } = req.params;
  report.clear(id);
  res.status(204).send();
});
