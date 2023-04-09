import { DataProvider } from '../classes/data-provider/DataProvider.ts';
import { failEmptyObjects } from '../utils/routerUtils.js';
import {
  addEvent,
  applyDelay,
  deleteAllEvents,
  deleteEvent,
  editEvent,
  reorderEvent,
} from '../services/RundownService.ts';

// Create controller for GET request to '/events'
// Returns -
export const rundownGetAll = async (req, res) => {
  res.json(DataProvider.getRundown());
};

// Create controller for GET request to '/events/:eventId'
// Returns -
export const getEventById = async (req, res) => {
  res.json(DataProvider.getEventById(req.params?.eventId));
};

// Create controller for POST request to '/events/'
// Returns -
export const rundownPost = async (req, res) => {
  if (failEmptyObjects(req.body, res)) {
    return;
  }

  try {
    const newEvent = await addEvent(req.body);
    res.status(201).send(newEvent);
  } catch (error) {
    res.status(400).send(error);
  }
};

// Create controller for PUT request to '/events/'
// Returns -
export const rundownPut = async (req, res) => {
  if (failEmptyObjects(req.body, res)) {
    return;
  }

  try {
    const event = await editEvent(req.body);
    res.status(200).send(event);
  } catch (error) {
    res.status(400).send(error);
  }
};

export const rundownReorder = async (req, res) => {
  if (failEmptyObjects(req.body, res)) {
    return;
  }

  try {
    const { eventId, from, to } = req.body;
    const event = await reorderEvent(eventId, from, to);
    res.status(200).send(event);
  } catch (error) {
    res.status(400).send(error);
  }
};

// Create controller for PATCH request to '/events/applydelay/:eventId'
// Returns -
export const rundownApplyDelay = async (req, res) => {
  try {
    await applyDelay(req.params.eventId);
    res.sendStatus(200);
  } catch (error) {
    res.status(400).send(error);
  }
};

// Create controller for DELETE request to '/events/:eventId'
// Returns -
export const deleteEventById = async (req, res) => {
  try {
    await deleteEvent(req.params.eventId);
    res.sendStatus(204);
  } catch (error) {
    res.status(400).send(error);
  }
};

// Create controller for DELETE request to '/events/'
// Returns -
export const rundownDelete = async (req, res) => {
  try {
    await deleteAllEvents();
    res.sendStatus(204);
  } catch (error) {
    res.status(400).send(error);
  }
};
