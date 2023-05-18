import express from 'express';
import { getEventData, postEventData } from '../controllers/eventDataController.js';
import { eventDataSanitizer } from '../controllers/eventDataController.validate.js';

export const router = express.Router();

// create route between controller and 'GET /event' endpoint
router.get('/', getEventData);

// create route between controller and 'POST /event' endpoint
router.post('/', eventDataSanitizer, postEventData);
