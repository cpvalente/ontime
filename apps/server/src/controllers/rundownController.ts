import { GetRundownCached } from 'ontime-types';

import { Request, Response, RequestHandler } from 'express';

import { publicProcedure } from '../trpc.js';

import {
  addEvent,
  applyDelay,
  batchEditEvents,
  deleteAllEvents,
  deleteEvent,
  editEvent,
  reorderEvent,
  swapEvents,
} from '../services/rundown-service/RundownService.js';
import { getDelayedRundown, getRundownCache } from '../services/rundown-service/delayedRundown.utils.js';
import {
  paramsMustHaveEventId,
  rundownBatchPutValidator,
  rundownPostValidator,
  rundownPutValidator,
  rundownReorderValidator,
  rundownSwapValidator,
} from './rundownController.validate.js';

export const getRundown = publicProcedure.query(() => {
  return getDelayedRundown();
});
// Create controller for GET request to '/events'
// Returns -
export const rundownGetAll: RequestHandler = async (_req, res) => {
  const delayedRundown = getDelayedRundown();
  res.json(delayedRundown);
};

// Create controller for GET request to '/events/cached'
// Returns -
export const rundownGetCached: RequestHandler = async (_req: Request, res: Response<GetRundownCached>) => {
  const cachedRundown = getRundownCache();
  res.json(cachedRundown);
};

// Create controller for POST request to '/events/'
// Returns -
export const rundownPost: RequestHandler = async (req, res) => {
  const validEvent = rundownPostValidator(req, res);
  if (!validEvent) return;

  try {
    const newEvent = await addEvent(validEvent);
    res.status(201).send(newEvent);
  } catch (error) {
    res.status(400).send({ message: error.message });
  }
};

// Create controller for PUT request to '/events/'
// Returns -
export const rundownPut: RequestHandler = async (req, res) => {
  const validEvent = rundownPutValidator(req, res);
  if (!validEvent) return;

  try {
    const event = await editEvent(validEvent);
    res.status(200).send(event);
  } catch (error) {
    res.status(400).send({ message: error.toString() });
  }
};

export const rundownBatchPut: RequestHandler = async (req, res) => {
  const validBatchEvents = rundownBatchPutValidator(req, res);
  if (!validBatchEvents) return;

  try {
    const { data, ids } = validBatchEvents;
    await batchEditEvents(ids, data);
    res.status(200);
  } catch (error) {
    res.status(400).send(error);
  }
};

export const rundownReorder: RequestHandler = async (req, res) => {
  const validEventReorder = rundownReorderValidator(req, res);
  if (!validEventReorder) return;

  try {
    const { eventId, from, to } = validEventReorder;
    const event = await reorderEvent(eventId, from, to);
    res.status(200).send(event);
  } catch (error) {
    res.status(400).send({ message: error });
  }
};

export const rundownSwap: RequestHandler = async (req, res) => {
  const validEventSwap = rundownSwapValidator(req, res);
  if (!validEventSwap) return;

  try {
    const { from, to } = validEventSwap;
    await swapEvents(from, to);
    res.sendStatus(200);
  } catch (error) {
    res.status(400).send({ message: error.toString() });
  }
};

// Create controller for PATCH request to '/events/applydelay/:eventId'
// Returns -
export const rundownApplyDelay: RequestHandler = async (req, res) => {
  const validEventId = paramsMustHaveEventId(req, res);
  if (!validEventId) return;

  try {
    await applyDelay(validEventId);
    res.sendStatus(200);
  } catch (error) {
    res.status(400).send({ message: error.toString() });
  }
};

// Create controller for DELETE request to '/events/:eventId'
// Returns -
export const deleteEventById: RequestHandler = async (req, res) => {
  const validEventId = paramsMustHaveEventId(req, res);
  if (!validEventId) return;

  try {
    await deleteEvent(validEventId);
    res.sendStatus(204);
  } catch (error) {
    res.status(400).send({ message: error.toString() });
  }
};

// Create controller for DELETE request to '/events/'
// Returns -
export const rundownDelete: RequestHandler = async (req, res) => {
  try {
    await deleteAllEvents();
    res.sendStatus(204);
  } catch (error) {
    res.status(400).send({ message: error.toString() });
  }
};
