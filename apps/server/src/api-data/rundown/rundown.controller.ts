import {
  ErrorResponse,
  MessageResponse,
  OntimeRundown,
  OntimeRundownEntry,
  PresetEvent,
  PresetEvents,
  RundownCached,
} from 'ontime-types';

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
import { getEventWithId, getNormalisedRundown, getRundown } from '../../services/rundown-service/rundownUtils.js';
import { createPresetEvent, getPresetEvents } from '../../services/rundown-service/rundownCache.js';
import { eventToPresetEvent } from 'ontime-utils';

export async function rundownGetAll(_req: Request, res: Response<OntimeRundown>) {
  const rundown = getRundown();
  res.json(rundown);
}

export async function rundownGetNormalised(_req: Request, res: Response<RundownCached>) {
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

export async function rundownBatchPut(req: Request, res: Response<MessageResponse | ErrorResponse>) {
  if (failEmptyObjects(req.body, res)) {
    return res.status(404);
  }

  try {
    const { data, ids } = req.body;
    await batchEditEvents(ids, data);
    res.status(200).send({ message: 'Batch edit successful' });
  } catch (error) {
    res.status(400).send(error);
  }
}

export async function rundownReorder(req: Request, res: Response<OntimeRundownEntry | ErrorResponse>) {
  if (failEmptyObjects(req.body, res)) {
    return;
  }

  try {
    const { eventId, from, to } = req.body;
    const event = await reorderEvent(eventId, from, to);
    res.status(200).send(event.newEvent);
  } catch (error) {
    res.status(400).send({ message: error.toString() });
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
    res.status(400).send({ message: error.toString() });
  }
}

export async function rundownApplyDelay(req: Request, res: Response<MessageResponse | ErrorResponse>) {
  try {
    await applyDelay(req.params.eventId);
    res.status(200).send({ message: 'Delay applied' });
  } catch (error) {
    res.status(400).send({ message: error.toString() });
  }
}

export async function rundownDelete(_req: Request, res: Response<MessageResponse | ErrorResponse>) {
  try {
    await deleteAllEvents();
    res.status(204).send({ message: 'All events deleted' });
  } catch (error) {
    res.status(400).send({ message: error.toString() });
  }
}

export async function deleteEventById(req: Request, res: Response<MessageResponse | ErrorResponse>) {
  try {
    await deleteEvent(req.params.eventId);
    res.status(204).send({ message: 'Event deleted' });
  } catch (error) {
    res.status(400).send({ message: error.toString() });
  }
}

export async function savePresetEvent(req: Request, res: Response<MessageResponse | ErrorResponse>) {
  try {
    const event = getEventWithId(req.params.eventId);
    const preset = eventToPresetEvent(event, req.params.label);
    await createPresetEvent(preset);
    res.status(200).send({ message: 'OK' });
  } catch (error) {
    res.status(400).send({ message: error.toString() });
  }
}

export async function getAllPresetEvents(req: Request, res: Response<PresetEvents | ErrorResponse>) {
  try {
    const presets = getPresetEvents();
    res.status(200).send(presets);
  } catch (error) {
    res.status(400).send({ message: error.toString() });
  }
}

export async function getPresetEvent(req: Request, res: Response<PresetEvent | ErrorResponse>) {
  try {
    const label = req.params.label;
    const presets = getPresetEvents();
    if (label in presets) {
      res.status(200).send(presets[label]);
    } else {
      res.status(400).send({ message: `Can't find preset: ${label} ` });
    }
  } catch (error) {
    res.status(400).send({ message: error.toString() });
  }
}
