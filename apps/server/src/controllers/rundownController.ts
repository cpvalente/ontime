import { RouteHandlerMethod, FastifyRequest, RouteGenericInterface, RawServerDefault } from 'fastify';

import { failEmptyObjects } from '../utils/routerUtils.js';
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
} from '../controllers/rundownController.validate.js';
import { JsonSchemaToTsProvider } from '@fastify/type-provider-json-schema-to-ts';
import { IncomingMessage } from 'http';

type extendedFastifyRequest<T> = FastifyRequest<
  RouteGenericInterface,
  RawServerDefault,
  IncomingMessage,
  T,
  JsonSchemaToTsProvider
>;

// Create controller for GET request to '/events'
// Returns -
export const rundownGetAll: RouteHandlerMethod = async (request, reply) => {
  const delayedRundown = getDelayedRundown();
  reply.send(delayedRundown);
};

// Create controller for GET request to '/events/cached'
// Returns -
export const rundownGetCached: RouteHandlerMethod = async (request, reply) => {
  const cachedRundown = getRundownCache();
  reply.send(cachedRundown);
};

// Create controller for POST request to '/events/'
// Returns -
export const rundownPost: RouteHandlerMethod = async (
  request: extendedFastifyRequest<typeof rundownPostSchema>,
  reply,
) => {
  if (failEmptyObjects(request.body, reply)) {
    return;
  }
  try {
    const newEvent = await addEvent(request.body);
    reply.status(201).send(newEvent);
  } catch (error) {
    reply.status(400).send({ message: error.toString() });
  }
};

// Create controller for PUT request to '/events/'
// Returns -
export const rundownPut: RouteHandlerMethod = async (
  request: extendedFastifyRequest<typeof rundownPutSchema>,
  reply,
) => {
  if (failEmptyObjects(request.body, reply)) {
    return;
  }

  try {
    const event = await editEvent(request.body);
    reply.status(200).send(event);
  } catch (error) {
    reply.status(400).send({ message: error.toString() });
  }
};

export const rundownReorder: RouteHandlerMethod = async (
  request: extendedFastifyRequest<typeof rundownReorderSchema>,
  reply,
) => {
  if (failEmptyObjects(request.body, reply)) {
    return;
  }

  try {
    const { eventId, from, to } = request.body;
    const event = await reorderEvent(eventId, from, to);
    reply.status(200).send(event);
  } catch (error) {
    reply.status(400).send({ message: error.toString() });
  }
};

export const rundownSwap: RouteHandlerMethod = async (
  request: extendedFastifyRequest<typeof rundownSwapSchema>,
  reply,
) => {
  if (failEmptyObjects(request.body, reply)) {
    return;
  }

  try {
    const { from, to } = request.body;
    await swapEvents(from, to);
    reply.status(200);
  } catch (error) {
    reply.status(400).send({ message: error.toString() });
  }
};

// Create controller for PATCH request to '/events/applydelay/:eventId'
// Returns -
export const rundownApplyDelay: RouteHandlerMethod = async (
  request: extendedFastifyRequest<typeof paramsMustHaveEventIdSchema>,
  reply,
) => {
  try {
    await applyDelay(request.params.eventId);
    reply.status(200);
  } catch (error) {
    reply.status(400).send({ message: error.toString() });
  }
};

// Create controller for DELETE request to '/events/:eventId'
// Returns -
export const deleteEventById: RouteHandlerMethod = async (
  request: extendedFastifyRequest<typeof paramsMustHaveEventIdSchema>,
  reply,
) => {
  try {
    await deleteEvent(request.params.eventId);
    reply.status(204);
  } catch (error) {
    reply.status(400).send({ message: error.toString() });
  }
};

// Create controller for DELETE request to '/events/'
// Returns -
export const rundownDelete: RouteHandlerMethod = async (request, reply) => {
  try {
    await deleteAllEvents();
    reply.status(204);
  } catch (error) {
    reply.status(400).send({ message: error.toString() });
  }
};
