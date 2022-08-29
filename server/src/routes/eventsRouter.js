import express from 'express';
export const router = express.Router();

// import events controller
import {
  eventsGetAll,
  eventsGetById,
  eventsPost,
  eventsPut,
  eventsPatch,
  eventsReorder,
  eventsApplyDelay,
  eventsDeleteAll,
  eventsDelete,
} from '../controllers/eventsController.js';

// create route between controller and '/events/' endpoint
router.get('/', eventsGetAll);

// create route between controller and '/events/:eventId' endpoint
router.get('/:eventId', eventsGetById);

// create route between controller and '/events/' endpoint
router.post('/', eventsPost);

// create route between controller and '/events/' endpoint
router.put('/', eventsPut);

// create route between controller and '/events/' endpoint
// DEPRECATED
router.patch('/', eventsPatch);

// create route between controller and '/events/reorder' endpoint
router.patch('/reorder/', eventsReorder);

// create route between controller and '/events/applydelay/:eventId' endpoint
router.patch('/applydelay/:eventId', eventsApplyDelay);

// create route between controller and '/events/all' endpoint
router.delete('/all', eventsDeleteAll);

// create route between controller and '/events/:eventId' endpoint
router.delete('/:eventId', eventsDelete);
