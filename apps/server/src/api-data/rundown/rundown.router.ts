import { ErrorResponse, MessageResponse, OntimeEntry, ProjectRundownsList, Rundown } from 'ontime-types';
import { getErrorMessage } from 'ontime-utils';

import type { Request, Response } from 'express';
import express from 'express';
import compression from 'compression';

import { getCurrentRundown } from './rundown.dao.js';
import { rundownCache } from './rundown.cache.js';
import {
  addEntry,
  applyDelay,
  batchEditEntries,
  cloneEntry,
  deleteAllEntries,
  deleteEntries,
  editEntry,
  groupEntries,
  reorderEntry,
  swapEvents,
  ungroupEntries,
} from './rundown.service.js';
import {
  rundownArrayOfIds,
  rundownBatchPutValidator,
  rundownPostValidator,
  rundownPutValidator,
  rundownReorderValidator,
  rundownSwapValidator,
} from './rundown.validation.js';
import { paramsWithId } from '../validation-utils/validationFunction.js';

export const router = express.Router();

router.use(compression());

/**
 * Returns all rundowns in the project
 */
router.get('/', async (_req: Request, res: Response<ProjectRundownsList>) => {
  const rundown = getCurrentRundown();

  // TODO: we currently make a project with only the current rundown
  res.json({
    loaded: rundown.id,
    rundowns: [
      {
        id: rundown.id,
        title: rundown.title,
        numEntries: rundown.order.length,
        revision: rundown.revision,
      },
    ],
  });
});

/**
 * Returns the current rundown
 */
router.get('/current', async (_req: Request, res: Response<Rundown>) => {
  const cachedRundown = rundownCache.get('current');
  if (cachedRundown) {
    return res.json(cachedRundown);
  }

  const rundown = getCurrentRundown();
  rundownCache.set('current', rundown);
  res.json(rundown);
});

router.post('/', rundownPostValidator, async (req: Request, res: Response<OntimeEntry | ErrorResponse>) => {
  try {
    const newEvent = await addEntry(req.body);
    rundownCache.delete('current');
    res.status(201).send(newEvent);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});

router.put('/', rundownPutValidator, async (req: Request, res: Response<OntimeEntry | ErrorResponse>) => {
  try {
    const event = await editEntry(req.body);
    rundownCache.delete('current');
    res.status(200).send(event);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});

router.put('/batch', rundownBatchPutValidator, async (req: Request, res: Response<Rundown | ErrorResponse>) => {
  try {
    const rundown = await batchEditEntries(req.body.ids, req.body.data);
    rundownCache.delete('current');
    res.status(200).send(rundown);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});

router.patch('/reorder', rundownReorderValidator, async (req: Request, res: Response<Rundown | ErrorResponse>) => {
  try {
    const { entryId, destinationId, order } = req.body;
    const newRundown = await reorderEntry(entryId, destinationId, order);
    rundownCache.delete('current');
    res.status(200).send(newRundown);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});

router.patch('/swap', rundownSwapValidator, async (req: Request, res: Response<Rundown | ErrorResponse>) => {
  try {
    const rundown = await swapEvents(req.body.from, req.body.to);
    rundownCache.delete('current');
    res.status(200).send(rundown);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});

router.patch('/applydelay/:id', paramsWithId, async (req: Request, res: Response<Rundown | ErrorResponse>) => {
  try {
    const newRundown = await applyDelay(req.params.id);
    rundownCache.delete('current');
    res.status(200).send(newRundown);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});

router.post('/clone/:id', paramsWithId, async (req: Request, res: Response<Rundown | ErrorResponse>) => {
  try {
    const newRundown = await cloneEntry(req.params.id);
    rundownCache.delete('current');
    res.status(200).send(newRundown);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});

router.post('/group', rundownArrayOfIds, async (req: Request, res: Response<Rundown | ErrorResponse>) => {
  try {
    const newRundown = await groupEntries(req.body.ids);
    rundownCache.delete('current');
    res.status(200).send(newRundown);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});

router.post('/ungroup/:id', paramsWithId, async (req: Request, res: Response<Rundown | ErrorResponse>) => {
  try {
    const newRundown = await ungroupEntries(req.params.id);
    rundownCache.delete('current');
    res.status(200).send(newRundown);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});

router.delete('/', rundownArrayOfIds, async (req: Request, res: Response<MessageResponse | ErrorResponse>) => {
  try {
    await deleteEntries(req.body.ids);
    rundownCache.delete('current');
    res.status(204).send({ message: 'Events deleted' });
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});

router.delete('/all', async (_req: Request, res: Response<Rundown | ErrorResponse>) => {
  try {
    const rundown = await deleteAllEntries();
    rundownCache.delete('current');
    res.status(204).send(rundown);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});
