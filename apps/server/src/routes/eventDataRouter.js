import express from 'express';
// import event controller
import { getEventData, postEventData } from '../controllers/eventDataController.ts';
import { eventDataSanitizer } from '../controllers/eventDataController.validate.ts';

export const router = express.Router();

// create route between controller and 'GET /event' endpoint
router.get('/', getEventData);

// create route between controller and 'POST /event' endpoint
router.post('/', eventDataSanitizer, postEventData);
