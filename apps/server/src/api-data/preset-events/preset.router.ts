import {
  deletePresetEvent,
  getAllPresetEvents,
  getPresetEvent,
  postPresetEvent,
  putPresetEvent,
  savePresetFromEvent,
} from './preset.controller.js';
import express from 'express';

export const router = express.Router();

//TODO: validate
router.get('/:label', getPresetEvent);
router.get('/', getAllPresetEvents);

router.post('/', postPresetEvent);
router.post('/:eventId/:label', savePresetFromEvent);

router.put('/:label', putPresetEvent);

router.delete('/:label', deletePresetEvent);
