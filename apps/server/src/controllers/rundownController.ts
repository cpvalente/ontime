import { RouteHandlerMethod } from 'fastify';
import {
  addEvent,
  applyDelay,
  deleteAllEvents,
  deleteEvent,
  editEvent,
  reorderEvent,
  swapEvents,
} from '../services/rundown-service/RundownService.js';
import { getDelayedRundown, getRundownCache } from '../services/rundown-service/delayedRundown.utils.js';
import {
  rundownPostSchema,
  rundownPutSchema,
  paramsMustHaveEventIdSchema,
  rundownReorderSchema,
  rundownSwapSchema,
} from '../controllers/rundownController.schema.js';
import { Request } from './controller.types.js';

/**
 * @description Create controller for GET request to '/events'.
 */
export const rundownGetAll: RouteHandlerMethod = async (req, res) => {
  const delayedRundown = getDelayedRundown();
  res.send(delayedRundown);
};

/**
 * @description Create controller for GET request to '/events/cached'
 */
export const rundownGetCached: RouteHandlerMethod = async (req, res) => {
  const cachedRundown = getRundownCache();
  res.send(cachedRundown);
};

/**
 * @description Create controller for POST request to '/events/'
 */
export const rundownPost: RouteHandlerMethod = async (req: Request<typeof rundownPostSchema>, res) => {
  try {
    const newEvent = await addEvent(req.body);
    res.status(201).send(newEvent);
  } catch (error) {
    res.status(400).send({ message: error.toString() });
  }
};

/**
 * @description Create controller for PUT request to '/events/'
 */
export const rundownPut: RouteHandlerMethod = async (req: Request<typeof rundownPutSchema>, res) => {
  try {
    const event = await editEvent(req.body);
    res.status(200).send(event);
  } catch (error) {
    res.status(400).send({ message: error.toString() });
  }
};

/**
 * @description Create controller for patch request to '/events/reorder'
 */
export const rundownReorder: RouteHandlerMethod = async (req: Request<typeof rundownReorderSchema>, res) => {
  try {
    const { eventId, from, to } = req.body;
    const event = await reorderEvent(eventId, from, to);
    res.status(200).send(event);
  } catch (error) {
    res.status(400).send({ message: error.toString() });
  }
};

/**
 * @description Create controller for patch request to '/events/swap'
 */
export const rundownSwap: RouteHandlerMethod = async (req: Request<typeof rundownSwapSchema>, res) => {
  try {
    const { from, to } = req.body;
    await swapEvents(from, to);
    res.status(200);
  } catch (error) {
    res.status(400).send({ message: error.toString() });
  }
};

/**
 * @description Create controller for PATCH request to '/events/applydelay/:eventId'
 */
export const rundownApplyDelay: RouteHandlerMethod = async (req: Request<typeof paramsMustHaveEventIdSchema>, res) => {
  try {
    await applyDelay(req.params.eventId);
    res.status(200);
  } catch (error) {
    res.status(400).send({ message: error.toString() });
  }
};

/**
 * @description Create controller for DELETE request to '/events/:eventId'
 */
export const deleteEventById: RouteHandlerMethod = async (req: Request<typeof paramsMustHaveEventIdSchema>, res) => {
  try {
    await deleteEvent(req.params.eventId);
    res.status(204);
  } catch (error) {
    res.status(400).send({ message: error.toString() });
  }
};

/**
 * @description Create controller for DELETE request to '/events/all'
 */
export const rundownDelete: RouteHandlerMethod = async (req, res) => {
  try {
    await deleteAllEvents();
    res.status(204);
  } catch (error) {
    res.status(400).send({ message: error.toString() });
  }
};
