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
} from '../controllers/rundownController.validate.js';

export const router = express.Router();

// create route between controller and '/eventlist/' endpoint
router.get('/', rundownGetAll);

// create route between controller and '/eventlist/:eventId' endpoint
router.get('/:eventId', getEventById);

// create route between controller and '/eventlist/' endpoint
router.post('/', rundownPostValidator, rundownPost);

// create route between controller and '/eventlist/' endpoint
router.put('/', rundownPutValidator, rundownPut);

// create route between controller and '/eventlist/reorder' endpoint
router.patch('/reorder/', rundownReorder);

// create route between controller and '/eventlist/applydelay/:eventId' endpoint
router.patch('/applydelay/:eventId', paramsMustHaveEventId, rundownApplyDelay);

// create route between controller and '/eventlist/all' endpoint
router.delete('/all', rundownDelete);

// create route between controller and '/eventlist/:eventId' endpoint
router.delete('/:eventId', paramsMustHaveEventId, deleteEventById);
