import { ErrorResponse, MessageResponse, OntimeEntry, Rundown } from 'ontime-types';
import { getErrorMessage } from 'ontime-utils';

import type { Request, Response } from 'express';
import express from 'express';

import {
  rundownAddToBlock,
  rundownCloneEntry,
  rundownUngroupEntries,
  rundownGetAll,
  rundownGetById,
  rundownGetCurrent,
  rundownSwap,
} from './rundown.controller.js';
import {
  addEntry,
  applyDelay,
  batchEditEntries,
  deleteAllEntries,
  deleteEntries,
  editEntry,
  reorderEntry,
} from './rundown.service.js';
import {
  paramsMustHaveEntryId,
  rundownArrayOfIds,
  rundownBatchPutValidator,
  rundownPostValidator,
  rundownPutValidator,
  rundownReorderValidator,
  rundownSwapValidator,
} from './rundown.validation.js';

export const router = express.Router();

router.get('/', rundownGetAll);
router.get('/current', rundownGetCurrent);
router.get('/:eventId', paramsMustHaveEntryId, rundownGetById); // not used in Ontime frontend

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
router.patch('/swap', rundownSwapValidator, rundownSwap);
router.patch(
  '/applydelay/:entryId',
  paramsMustHaveEntryId,
  async (req: Request, res: Response<Rundown | ErrorResponse>) => {
    try {
      const newRundown = await applyDelay(req.params.entryId);
      res.status(200).send(newRundown);
    } catch (error) {
      const message = getErrorMessage(error);
      res.status(400).send({ message });
    }
  },
);

router.post('/clone/:entryId', paramsMustHaveEntryId, rundownCloneEntry);
router.post('/ungroup/:entryId', paramsMustHaveEntryId, rundownUngroupEntries);
router.post('/group', rundownArrayOfIds, rundownAddToBlock);

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
