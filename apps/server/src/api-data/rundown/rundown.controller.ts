import { ErrorResponse, MessageResponse, OntimeEntry, ProjectRundownsList, Rundown } from 'ontime-types';
import { getErrorMessage } from 'ontime-utils';

import type { Request, Response } from 'express';

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
import { getEventWithId, getCurrentRundown } from '../../services/rundown-service/rundownUtils.js';

export async function rundownGetAll(_req: Request, res: Response<ProjectRundownsList>) {
  const rundown = getCurrentRundown();
  res.json([{ id: rundown.id, title: rundown.title, numEntries: rundown.order.length, revision: rundown.revision }]);
}

export async function rundownGetCurrent(_req: Request, res: Response<Rundown>) {
  const cachedRundown = getCurrentRundown();
  res.json(cachedRundown);
}

export async function rundownGetById(req: Request, res: Response<OntimeEntry | ErrorResponse>) {
  const { eventId } = req.params;

  try {
    const event = getEventWithId(eventId);

    if (!event) {
      res.status(404).send({ message: 'Event not found' });
      return;
    }
    res.status(200).json(event);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(500).json({ message });
  }
}

export async function rundownPost(req: Request, res: Response<OntimeEntry | ErrorResponse>) {
  if (failEmptyObjects(req.body, res)) {
    return;
  }

  try {
    const newEvent = await addEvent(req.body);
    res.status(201).send(newEvent);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
}

export async function rundownPut(req: Request, res: Response<OntimeEntry | ErrorResponse>) {
  if (failEmptyObjects(req.body, res)) {
    return;
  }

  try {
    const event = await editEvent(req.body);
    res.status(200).send(event);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
}

export async function rundownBatchPut(req: Request, res: Response<MessageResponse | ErrorResponse>) {
  if (failEmptyObjects(req.body, res)) {
    return res.status(404);
  }

  try {
    const { data, ids } = req.body;
    await batchEditEvents(ids, data);
    res.status(200).send({ message: 'Batch edit successful' });
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
}

export async function rundownReorder(req: Request, res: Response<OntimeEntry | ErrorResponse>) {
  if (failEmptyObjects(req.body, res)) {
    return;
  }

  try {
    const { eventId, from, to } = req.body;
    const event = await reorderEvent(eventId, from, to);
    res.status(200).send(event.newEvent);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
}

export async function rundownSwap(req: Request, res: Response<MessageResponse | ErrorResponse>) {
  if (failEmptyObjects(req.body, res)) {
    return;
  }

  try {
    const { from, to } = req.body;
    await swapEvents(from, to);
    res.status(200).send({ message: 'Swap successful' });
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
}

export async function rundownApplyDelay(req: Request, res: Response<MessageResponse | ErrorResponse>) {
  try {
    await applyDelay(req.params.eventId);
    res.status(200).send({ message: 'Delay applied' });
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
}

export async function rundownDelete(_req: Request, res: Response<MessageResponse | ErrorResponse>) {
  try {
    await deleteAllEvents();
    res.status(204).send({ message: 'All events deleted' });
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
}

export async function deletesEventById(req: Request, res: Response<MessageResponse | ErrorResponse>) {
  try {
    await deleteEvent(req.body.ids);
    res.status(204).send({ message: 'Events deleted' });
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
}
