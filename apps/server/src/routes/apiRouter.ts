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
  let action = req.path.substring(1);
  const actionArray = action.split('/');
  
  const params = { payload: req.query };
  
  //TODO: this can be better
  if (actionArray.length > 1) {
    action = actionArray.shift();
    params.payload = actionArray.reduceRight(
      (parm, key, index) => (index === actionArray.length - 1 ? { [key]: params.payload } : { [key]: parm }),
      {},
    );
  }
  try {
    const reply = dispatchFromAdapter(action, params, 'http');
    res.status(202).json(reply);
  } catch (error) {
    logger.error(LogOrigin.Rx, `HTTP IN: ${error}`);
    res.status(500).json({ error: error.message });
  }
});
