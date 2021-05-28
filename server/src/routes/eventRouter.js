import express from 'express';
export const router = express.Router();

// import event controller
import { getEvent, postEvent } from '../controllers/eventController.js';

// create route between controller and 'GET /event' endpoint
router.get('/', getEvent);

// create route between controller and 'POST /event' endpoint
router.post('/', postEvent);
