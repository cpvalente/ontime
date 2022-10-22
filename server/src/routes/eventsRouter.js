import express from 'express';
// import events controller
import {
  eventsApplyDelay,
  eventsDelete,
  eventsDeleteAll,
  eventsGetAll,
  eventsGetById,
  eventsPatch,
  eventsPost,
  eventsPut,
  eventsReorder,
} from '../controllers/eventsController.js';
import {
  eventsPostValidator,
  eventsPutValidator,
  paramsMustHaveEventId,
} from '../controllers/eventsController.validate.js';

export const router = express.Router();

// create route between controller and '/events/' endpoint
router.get('/', eventsGetAll);

// create route between controller and '/events/:eventId' endpoint
router.get('/:eventId', eventsGetById);

// create route between controller and '/events/' endpoint
router.post('/', eventsPostValidator, eventsPost);

// create route between controller and '/events/' endpoint
router.put('/', eventsPutValidator, eventsPut);

// create route between controller and '/events/' endpoint
// DEPRECATED
router.patch('/', eventsPatch);

// create route between controller and '/events/reorder' endpoint
router.patch('/reorder/', eventsReorder);

// create route between controller and '/events/applydelay/:eventId' endpoint
router.patch('/applydelay/:eventId', paramsMustHaveEventId, eventsApplyDelay);

// create route between controller and '/events/all' endpoint
router.delete('/all', eventsDeleteAll);

// create route between controller and '/events/:eventId' endpoint
router.delete('/:eventId', paramsMustHaveEventId, eventsDelete);
