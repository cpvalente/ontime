import { ErrorResponse, MessageResponse, OntimeEntry, ProjectRundownsList, Rundown } from 'ontime-types';
import { getErrorMessage } from 'ontime-utils';

import type { Request, Response } from 'express';

import { failEmptyObjects } from '../../utils/routerUtils.js';
import { ungroupEntries, groupEntries, swapEvents, cloneEntry } from '../../services/rundown-service/RundownService.js';
import { getEntryWithId } from '../../services/rundown-service/rundownUtils.js';

import { getCurrentRundown } from './rundown.dao.js';

/**
 * Returns all rundowns in the project
 * TODO: we currently only return the current rundown
 */
export async function rundownGetAll(_req: Request, res: Response<ProjectRundownsList>) {
  const rundown = getCurrentRundown();
  res.json([{ id: rundown.id, title: rundown.title, numEntries: rundown.order.length, revision: rundown.revision }]);
}

/**
 * Returns the current rundown
 */
export async function rundownGetCurrent(_req: Request, res: Response<Rundown>) {
  const rundown = getCurrentRundown();
  res.json(rundown);
}

export async function rundownGetById(req: Request, res: Response<OntimeEntry | ErrorResponse>) {
  const { eventId } = req.params;

  try {
    const event = getEntryWithId(eventId);

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

export async function rundownCloneEntry(req: Request, res: Response<Rundown | ErrorResponse>) {
  try {
    const newRundown = await cloneEntry(req.params.entryId);
    res.status(200).send(newRundown);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
}

export async function rundownUngroupEntries(req: Request, res: Response<Rundown | ErrorResponse>) {
  try {
    const newRundown = await ungroupEntries(req.params.entryId);
    res.status(200).send(newRundown);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
}

export async function rundownAddToBlock(req: Request, res: Response<Rundown | ErrorResponse>) {
  try {
    const newRundown = await groupEntries(req.body.ids);
    res.status(200).send(newRundown);
  } catch (error) {
    const message = getErrorMessage(error);
    res.status(400).send({ message });
  }
}
