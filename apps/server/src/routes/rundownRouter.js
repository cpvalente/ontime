import express from 'express';
import {
  deleteEventById,
  getEventById,
  rundownApplyDelay,
  rundownDelete,
  rundownGetAll,
  rundownPost,
  rundownPut,
  rundownReorder,
} from '../controllers/rundownController.js';
import {
  paramsMustHaveEventId,
  rundownPostValidator,
  rundownPutValidator,
  rundownReorderValidator,
} from '../controllers/rundownController.validate.js';

export const router = express.Router();

// create route between controller and '/events/' endpoint
router.get('/', rundownGetAll);

// create route between controller and '/events/:eventId' endpoint
router.get('/:eventId', paramsMustHaveEventId, getEventById);

// create route between controller and '/events/' endpoint
router.post('/', rundownPostValidator, rundownPost);

// create route between controller and '/events/' endpoint
router.put('/', rundownPutValidator, rundownPut);

// create route between controller and '/events/reorder' endpoint
router.patch('/reorder/', rundownReorderValidator, rundownReorder);

// create route between controller and '/events/applydelay/:eventId' endpoint
router.patch('/applydelay/:eventId', paramsMustHaveEventId, rundownApplyDelay);

// create route between controller and '/events/all' endpoint
router.delete('/all', rundownDelete);

// create route between controller and '/events/:eventId' endpoint
router.delete('/:eventId', paramsMustHaveEventId, deleteEventById);
