import express from 'express';

import {
  deletesEventById,
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
  rundownArrayOfIds,
  rundownBatchPutValidator,
  rundownPostValidator,
  rundownPutValidator,
  rundownReorderValidator,
  rundownSwapValidator,
} from './rundown.validation.js';
import { preventIfFrozen } from './rundown.middleware.js';

export const router = express.Router();

router.get('/', rundownGetAll); // not used in Ontime frontend
router.get('/normalised', rundownGetNormalised);

router.post('/', rundownPostValidator, rundownPost);

router.put('/', rundownPutValidator, rundownPut);
router.put('/batch', rundownBatchPutValidator, rundownBatchPut);

router.patch('/reorder/', rundownReorderValidator, preventIfFrozen, rundownReorder);
router.patch('/swap', rundownSwapValidator, preventIfFrozen, rundownSwap);
router.patch('/applydelay/:eventId', paramsMustHaveEventId, rundownApplyDelay);

router.delete('/', rundownArrayOfIds, preventIfFrozen, deletesEventById);
router.delete('/all', preventIfFrozen, rundownDelete);
