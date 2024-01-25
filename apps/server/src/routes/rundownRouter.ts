import express from 'express';

import { router as trpcRouter } from '../trpc.js';

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
  rundownBatchPut,
  getRundown,
} from '../controllers/rundownController.js';

export const rundownRouterr = trpcRouter({
  getRundown,
});

export const router = express.Router();

// create route between controller and '/events/cached' endpoint
router.get('/cached', rundownGetCached);

// create route between controller and '/events/' endpoint
router.get('/', rundownGetAll);

// create route between controller and '/events/' endpoint
router.post('/', rundownPost);

// create route between controller and '/events/' endpoint
router.put('/', rundownPut);

router.put('/batchEdit', rundownBatchPut);

// create route between controller and '/events/reorder' endpoint
router.patch('/reorder', rundownReorder);

router.patch('/swap', rundownSwap);

// create route between controller and '/events/applydelay/:eventId' endpoint
router.patch('/applydelay/:eventId', rundownApplyDelay);

// create route between controller and '/events/all' endpoint
router.delete('/all', rundownDelete);

// create route between controller and '/events/:eventId' endpoint
router.delete('/:eventId', deleteEventById);
