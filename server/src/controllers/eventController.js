// get database
import { db, data } from '../app.js';

// Create controller for GET request to 'event'
// Returns ACK message
export const getEvent = async (req, res) => {
  res.json(data.event);
};

// Create controller for POST request to 'event'
// Returns ACK message
export const postEvent = async (req, res) => {
  if (!req.body) {
    res.status(400).send('No object found in request');
    return;
  }
  // TODO: validate data
  try {
    data.event = { ...data.event, ...req.body };
    await db.write();
    res.sendStatus(200);
  } catch (error) {
    res.status(400).send(error);
  }
};
