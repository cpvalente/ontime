import { Request, Response } from 'express';
import { getEventWithId } from '../../services/rundown-service/rundownUtils.js';
import { eventToPresetEvent } from 'ontime-utils';
import {
  createPresetEvent,
  editPresetEvent,
  getPresetEvents,
  removePresetEvent,
} from '../../services/rundown-service/rundownCache.js';
import { ErrorResponse, PresetEvent, PresetEvents } from 'ontime-types';

export async function savePresetFromEvent(req: Request, res: Response<PresetEvents | ErrorResponse>) {
  try {
    const event = getEventWithId(req.params.eventId);
    const preset = eventToPresetEvent(event, req.params.label);
    const presets = await createPresetEvent(preset);
    res.status(200).send(presets);
  } catch (error) {
    res.status(400).send({ message: error.toString() });
  }
}

export async function postPresetEvent(req: Request, res: Response<PresetEvents | ErrorResponse>) {
  try {
    const newPreset = req.body as PresetEvent;
    const allPresets = await createPresetEvent(newPreset);
    res.status(201).json(allPresets);
  } catch (error) {
    res.status(400).send({ message: error.toString() });
  }
}

export async function putPresetEvent(req: Request, res: Response) {
  try {
    const oldLabel = req.params.label;
    const newPreset = req.body as PresetEvent;
    const allPresets = await editPresetEvent(oldLabel, newPreset);
    res.status(200).json(allPresets);
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

export async function deletePresetEvent(req: Request, res: Response) {
  try {
    const presetToDelete = req.params.label;
    await removePresetEvent(presetToDelete);
    res.sendStatus(204);
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
