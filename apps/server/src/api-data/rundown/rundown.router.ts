import express from 'express';

import {
  deleteEventById,
  rundownApplyDelay,
  rundownBatchPut,
  rundownDelete,
  rundownGetAll,
  rundownGetNormalised,
  rundownPost,
  rundownPut,
  rundownReorder,
  rundownSwap,
} from './rundown.controller.js';
import {
  paramsMustHaveEventId,
  rundownBatchPutValidator,
  rundownPostValidator,
  rundownPutValidator,
  rundownReorderValidator,
  rundownSwapValidator,
} from './rundown.validation.js';

export const router = express.Router();

router.get('/', rundownGetAll); // not used in Ontime frontend
router.get('/normalised', rundownGetNormalised);

router.post('/', rundownPostValidator, rundownPost);

router.put('/', rundownPutValidator, rundownPut);
router.put('/batch', rundownBatchPutValidator, rundownBatchPut);

router.patch('/reorder/', rundownReorderValidator, rundownReorder);
router.patch('/swap', rundownSwapValidator, rundownSwap);
router.patch('/applydelay/:eventId', paramsMustHaveEventId, rundownApplyDelay);

router.delete('/all', rundownDelete);
router.delete('/:eventId', paramsMustHaveEventId, deleteEventById);
