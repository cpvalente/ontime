import { ErrorResponse, MessageResponse, OntimeEntry, ProjectRundownsList, Rundown } from 'ontime-types';
import { getErrorMessage } from 'ontime-utils';

import type { Request, Response } from 'express';
import express from 'express';

import { getCurrentRundown } from './rundown.dao.js';
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

/**
 * Returns all rundowns in the project
 */
router.get('/', async (_req: Request, res: Response<ProjectRundownsList>) => {
  const rundown = getCurrentRundown();

  // TODO: we currently make a project with only the current rundown
  res.json([{ id: rundown.id, title: rundown.title, numEntries: rundown.order.length, revision: rundown.revision }]);
});

/**
 * Returns the current rundown
 */
router.get('/current', async (_req: Request, res: Response<Rundown>) => {
  const rundown = getCurrentRundown();
  res.json(rundown);
});

router.post('/', rundownPostValidator, async (req: Request, res: Response<OntimeEntry | ErrorResponse>) => {
  try {
    const newEvent = await addEntry(req.body);
    res.status(201).send(newEvent);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});

router.put('/', rundownPutValidator, async (req: Request, res: Response<OntimeEntry | ErrorResponse>) => {
  try {
    const event = await editEntry(req.body);
    res.status(200).send(event);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});

router.put('/batch', rundownBatchPutValidator, async (req: Request, res: Response<Rundown | ErrorResponse>) => {
  try {
    const rundown = await batchEditEntries(req.body.ids, req.body.data);
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
    res.status(200).send(newRundown);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});

router.patch('/swap', rundownSwapValidator, async (req: Request, res: Response<Rundown | ErrorResponse>) => {
  try {
    const rundown = await swapEvents(req.body.from, req.body.to);
    res.status(200).send(rundown);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});

router.patch(
  '/applydelay/:id',
  paramsWithId,
  async (req: Request, res: Response<Rundown | ErrorResponse>) => {
    try {
      const newRundown = await applyDelay(req.params.id);
      res.status(200).send(newRundown);
    } catch (error) {
      const message = getErrorMessage(error);
      res.status(400).send({ message });
    }
  },
);

router.post('/clone/:id', paramsWithId, async (req: Request, res: Response<Rundown | ErrorResponse>) => {
  try {
    const newRundown = await cloneEntry(req.params.id);
    res.status(200).send(newRundown);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});

router.post('/group', rundownArrayOfIds, async (req: Request, res: Response<Rundown | ErrorResponse>) => {
  try {
    const newRundown = await groupEntries(req.body.ids);
    res.status(200).send(newRundown);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});

router.post(
  '/ungroup/:id',
  paramsWithId,
  async (req: Request, res: Response<Rundown | ErrorResponse>) => {
    try {
      const newRundown = await ungroupEntries(req.params.id);
      res.status(200).send(newRundown);
    } catch (error) {
      const message = getErrorMessage(error);
      res.status(400).send({ message });
    }
  },
);

router.delete('/', rundownArrayOfIds, async (req: Request, res: Response<MessageResponse | ErrorResponse>) => {
  try {
    await deleteEntries(req.body.ids);
    res.status(204).send({ message: 'Events deleted' });
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});

router.delete('/all', async (_req: Request, res: Response<Rundown | ErrorResponse>) => {
  try {
    const rundown = await deleteAllEntries();
    res.status(204).send(rundown);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
});
