import express from 'express';
import {
  deleteEventById,
  rundownApplyDelay,
  rundownDelete,
  rundownGetAll,
  rundownGetCached,
  rundownPost,
  rundownPut,
  rundownReorder,
  rundownSwap,
} from '../controllers/rundownController.js';
import {
  paramsMustHaveEventId,
  rundownPostValidator,
  rundownPutValidator,
  rundownReorderValidator,
  rundownSwapValidator,
} from '../controllers/rundownController.validate.js';

export const router = express.Router();

// create route between controller and '/events/cached' endpoint
router.get('/cached', rundownGetCached);

// create route between controller and '/events/' endpoint
router.get('/', rundownGetAll);

// create route between controller and '/events/' endpoint
router.post('/', rundownPostValidator, rundownPost);

// create route between controller and '/events/' endpoint
router.put('/', rundownPutValidator, rundownPut);

// create route between controller and '/events/reorder' endpoint
router.patch('/reorder/', rundownReorderValidator, rundownReorder);

router.patch('/swap', rundownSwapValidator, rundownSwap);

// create route between controller and '/events/applydelay/:eventId' endpoint
router.patch('/applydelay/:eventId', paramsMustHaveEventId, rundownApplyDelay);

// create route between controller and '/events/all' endpoint
router.delete('/all', rundownDelete);

// create route between controller and '/events/:eventId' endpoint
router.delete('/:eventId', paramsMustHaveEventId, deleteEventById);
