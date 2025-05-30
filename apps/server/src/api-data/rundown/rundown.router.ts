import { ErrorResponse, OntimeEntry, Rundown } from 'ontime-types';
import { getErrorMessage } from 'ontime-utils';

import type { Request, Response } from 'express';
import express from 'express';

import { reorderEntry } from '../../services/rundown-service/RundownService.js';

import {
  deletesEventById,
  rundownAddToBlock,
  rundownApplyDelay,
  rundownBatchPut,
  rundownCloneEntry,
  rundownDelete,
  rundownUngroupEntries,
  rundownGetAll,
  rundownGetById,
  rundownGetCurrent,
  rundownPut,
  rundownSwap,
} from './rundown.controller.js';
import { addEntry } from './rundown.service.js';
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

router.put('/', rundownPutValidator, rundownPut);
router.put('/batch', rundownBatchPutValidator, rundownBatchPut);

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
router.patch('/applydelay/:entryId', paramsMustHaveEntryId, rundownApplyDelay);
router.post('/clone/:entryId', paramsMustHaveEntryId, rundownCloneEntry);
router.post('/ungroup/:entryId', paramsMustHaveEntryId, rundownUngroupEntries);
router.post('/group', rundownArrayOfIds, rundownAddToBlock);

router.delete('/', rundownArrayOfIds, deletesEventById);
router.delete('/all', rundownDelete);
