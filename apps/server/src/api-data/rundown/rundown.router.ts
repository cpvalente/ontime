import express from 'express';

import {
  deletesEventById,
  rundownAddToBlock,
  rundownApplyDelay,
  rundownBatchPut,
  rundownCloneEntry,
  rundownDelete,
  rundownDissolveBlock,
  rundownGetAll,
  rundownGetById,
  rundownGetCurrent,
  rundownPost,
  rundownPut,
  rundownReorder,
  rundownSwap,
} from './rundown.controller.js';
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

router.post('/', rundownPostValidator, rundownPost);

router.put('/', rundownPutValidator, rundownPut);
router.put('/batch', rundownBatchPutValidator, rundownBatchPut);

router.patch('/reorder/', rundownReorderValidator, rundownReorder);
router.patch('/swap', rundownSwapValidator, rundownSwap);
router.patch('/applydelay/:entryId', paramsMustHaveEntryId, rundownApplyDelay);
router.post('/clone/:entryId', paramsMustHaveEntryId, rundownCloneEntry);
router.post('/dissolve/:entryId', paramsMustHaveEntryId, rundownDissolveBlock);
router.post('/group', rundownArrayOfIds, rundownAddToBlock);

router.delete('/', rundownArrayOfIds, deletesEventById);
router.delete('/all', rundownDelete);
