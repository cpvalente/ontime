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
export const rundownGetAll: RouteHandlerMethod = async (request, reply) => {
  const delayedRundown = getDelayedRundown();
  reply.send(delayedRundown);
};

/**
 * @description Create controller for GET request to '/events/cached'
 */
export const rundownGetCached: RouteHandlerMethod = async (request, reply) => {
  const cachedRundown = getRundownCache();
  reply.send(cachedRundown);
};

/**
 * @description Create controller for POST request to '/events/'
 */
export const rundownPost: RouteHandlerMethod = async (request: Request<typeof rundownPostSchema>, reply) => {
  try {
    const newEvent = await addEvent(request.body);
    reply.status(201).send(newEvent);
  } catch (error) {
    reply.status(400).send({ message: error.toString() });
  }
};

/**
 * @description Create controller for PUT request to '/events/'
 */
export const rundownPut: RouteHandlerMethod = async (request: Request<typeof rundownPutSchema>, reply) => {
  try {
    const event = await editEvent(request.body);
    reply.status(200).send(event);
  } catch (error) {
    reply.status(400).send({ message: error.toString() });
  }
};

/**
 * @description Create controller for patch request to '/events/reorder'
 */
export const rundownReorder: RouteHandlerMethod = async (request: Request<typeof rundownReorderSchema>, reply) => {
  try {
    const { eventId, from, to } = request.body;
    const event = await reorderEvent(eventId, from, to);
    reply.status(200).send(event);
  } catch (error) {
    reply.status(400).send({ message: error.toString() });
  }
};

/**
 * @description Create controller for patch request to '/events/swap'
 */
export const rundownSwap: RouteHandlerMethod = async (request: Request<typeof rundownSwapSchema>, reply) => {
  try {
    const { from, to } = request.body;
    await swapEvents(from, to);
    reply.status(200);
  } catch (error) {
    reply.status(400).send({ message: error.toString() });
  }
};

/**
 * @description Create controller for PATCH request to '/events/applydelay/:eventId'
 */
export const rundownApplyDelay: RouteHandlerMethod = async (
  request: Request<typeof paramsMustHaveEventIdSchema>,
  reply,
) => {
  try {
    await applyDelay(request.params.eventId);
    reply.status(200);
  } catch (error) {
    reply.status(400).send({ message: error.toString() });
  }
};

/**
 * @description Create controller for DELETE request to '/events/:eventId'
 */
export const deleteEventById: RouteHandlerMethod = async (
  request: Request<typeof paramsMustHaveEventIdSchema>,
  reply,
) => {
  try {
    await deleteEvent(request.params.eventId);
    reply.status(204);
  } catch (error) {
    reply.status(400).send({ message: error.toString() });
  }
};

/**
 * @description Create controller for DELETE request to '/events/all'
 */
export const rundownDelete: RouteHandlerMethod = async (request, reply) => {
  try {
    await deleteAllEvents();
    reply.status(204);
  } catch (error) {
    reply.status(400).send({ message: error.toString() });
  }
};
