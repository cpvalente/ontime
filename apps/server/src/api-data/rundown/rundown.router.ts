import express from 'express';

import {
  deleteEventById,
  getAllPresetEvents,
  getPresetEvent,
  rundownApplyDelay,
  rundownBatchPut,
  rundownDelete,
  rundownGetAll,
  rundownGetNormalised,
  rundownPost,
  rundownPut,
  rundownReorder,
  rundownSwap,
  savePresetEvent,
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
router.get('/preset/:label', getPresetEvent);
router.get('/preset/', getAllPresetEvents);

router.post('/', rundownPostValidator, rundownPost);

//TODO: validate
router.post('/preset/:eventId/:label', savePresetEvent);

router.put('/', rundownPutValidator, rundownPut);
router.put('/batch', rundownBatchPutValidator, rundownBatchPut);

router.patch('/reorder/', rundownReorderValidator, rundownReorder);
router.patch('/swap', rundownSwapValidator, rundownSwap);
router.patch('/applydelay/:eventId', paramsMustHaveEventId, rundownApplyDelay);

router.delete('/all', rundownDelete);
router.delete('/:eventId', paramsMustHaveEventId, deleteEventById);
