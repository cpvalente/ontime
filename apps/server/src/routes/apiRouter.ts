import express from 'express';
import { dispatchFromAdapter } from '../controllers/integrationController.js';

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

  console.log('got here', action, params)

  // TODO: we need to double-check the returns from dispatchFromAdapter
  try {
    const reply = dispatchFromAdapter(action, params, 'http');
    res.status(202).json(reply ?? { message: 'success' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
