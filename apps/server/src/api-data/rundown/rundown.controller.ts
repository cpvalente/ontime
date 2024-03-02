import { ErrorResponse, OntimeRundown, OntimeRundownEntry, RundownCached } from 'ontime-types';

import { Request, Response } from 'express';

import { failEmptyObjects } from '../../utils/routerUtils.js';
import {
  addEvent,
  applyDelay,
  batchEditEvents,
  deleteAllEvents,
  deleteEvent,
  editEvent,
  reorderEvent,
  swapEvents,
} from '../../services/rundown-service/RundownService.js';
import { getNormalisedRundown, getRundown } from '../../services/rundown-service/rundownUtils.js';

export async function rundownGetAll(_req: Request, res: Response<OntimeRundown>) {
  const rundown = getRundown();
  res.json(rundown);
}

export async function rundownGetCached(_req: Request, res: Response<RundownCached>) {
  const cachedRundown = getNormalisedRundown();
  res.json(cachedRundown);
}

export async function rundownPost(req: Request, res: Response<OntimeRundownEntry | ErrorResponse>) {
  if (failEmptyObjects(req.body, res)) {
    return;
  }

  try {
    const newEvent = await addEvent(req.body);
    res.status(201).send(newEvent);
  } catch (error) {
    res.status(400).send({ message: error.toString() });
  }
}

export async function rundownPut(req: Request, res: Response<OntimeRundownEntry | ErrorResponse>) {
  if (failEmptyObjects(req.body, res)) {
    return;
  }

  try {
    const event = await editEvent(req.body);
    res.status(200).send(event);
  } catch (error) {
    res.status(400).send({ message: error.toString() });
  }
}

export async function rundownBatchPut(req: Request, res: Response) {
  if (failEmptyObjects(req.body, res)) {
    return res.status(404);
  }

  try {
    const { data, ids } = req.body;
    await batchEditEvents(ids, data);
    res.status(200);
  } catch (error) {
    res.status(400).send(error);
  }
}

export async function rundownReorder(req: Request, res: Response) {
  if (failEmptyObjects(req.body, res)) {
    return;
  }

  try {
    const { eventId, from, to } = req.body;
    const event = await reorderEvent(eventId, from, to);
    res.status(200).send(event);
  } catch (error) {
    res.status(400).send({ message: error.toString() });
  }
}

export async function rundownSwap(req: Request, res: Response) {
  if (failEmptyObjects(req.body, res)) {
    return;
  }

  try {
    const { from, to } = req.body;
    await swapEvents(from, to);
    res.sendStatus(200);
  } catch (error) {
    res.status(400).send({ message: error.toString() });
  }
}

export async function rundownApplyDelay(req: Request, res: Response) {
  try {
    await applyDelay(req.params.eventId);
    res.sendStatus(200);
  } catch (error) {
    res.status(400).send({ message: error.toString() });
  }
}

export async function deleteEventById(req: Request, res: Response) {
  try {
    await deleteEvent(req.params.eventId);
    res.sendStatus(204);
  } catch (error) {
    res.status(400).send({ message: error.toString() });
  }
}

export async function rundownDelete(req: Request, res: Response) {
  try {
    await deleteAllEvents();
    res.sendStatus(204);
  } catch (error) {
    res.status(400).send({ message: error.toString() });
  }
}
