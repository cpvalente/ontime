import express from 'express';

import {
  deleteEventById,
  rundownApplyDelay,
  rundownBatchPut,
  rundownDelete,
  rundownGetAll,
  rundownGetCached,
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

router.get('/', rundownGetAll);
router.get('/cached', rundownGetCached);

router.post('/', rundownPostValidator, rundownPost);

router.put('/', rundownPutValidator, rundownPut);
router.put('/batchEdit', rundownBatchPutValidator, rundownBatchPut);

router.patch('/reorder/', rundownReorderValidator, rundownReorder);
router.patch('/swap', rundownSwapValidator, rundownSwap);
router.patch('/applydelay/:eventId', paramsMustHaveEventId, rundownApplyDelay);

router.delete('/all', rundownDelete);
router.delete('/:eventId', paramsMustHaveEventId, deleteEventById);
