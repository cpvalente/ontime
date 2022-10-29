import express from 'express';
import {
  rundownGetAll,
  rundownPost,
  getEventById,
  rundownPut,
  rundownReorder,
  rundownApplyDelay,
  deleteEventById,
  rundownDelete,
} from '../controllers/rundownController.js';
import {
  rundownPostValidator,
  rundownPutValidator,
  paramsMustHaveEventId,
} from '../controllers/rundownController.validate.js';

export const router = express.Router();

// create route between controller and '/rundown/' endpoint
router.get('/', rundownGetAll);

// create route between controller and '/rundown/:eventId' endpoint
router.get('/:eventId', getEventById);

// create route between controller and '/rundown/' endpoint
router.post('/', rundownPostValidator, rundownPost);

// create route between controller and '/rundown/' endpoint
router.put('/', rundownPutValidator, rundownPut);

// create route between controller and '/rundown/reorder' endpoint
router.patch('/reorder/', rundownReorder);

// create route between controller and '/rundown/applydelay/:eventId' endpoint
router.patch('/applydelay/:eventId', paramsMustHaveEventId, rundownApplyDelay);

// create route between controller and '/rundown/all' endpoint
router.delete('/all', rundownDelete);

// create route between controller and '/rundown/:eventId' endpoint
router.delete('/:eventId', paramsMustHaveEventId, deleteEventById);
