import express from 'express';
import { dispatchFromAdapter } from '../controllers/integrationController.js';
import { logger } from '../classes/Logger.js';
import { LogOrigin } from 'ontime-types';

export const router = express.Router();

const helloMessage = 'You have reached Ontime API server';

// create route between controller and '/api/' endpoint
router.get('/', (_req, res) => {
  res.status(200).json({ message: helloMessage });
});

// any GET request in /api is sent to the integration controller
router.get('/*', (req, res) => {
  const action = req.path.substring(1);
  const params = { payload: req.query };

  try {
    const reply = dispatchFromAdapter(action, params, 'http');
    res.status(202).json(reply);
  } catch (error) {
    logger.error(LogOrigin.Rx, `HTTP IN: ${error}`);
    res.status(500).json({ error: error.message });
  }
});
