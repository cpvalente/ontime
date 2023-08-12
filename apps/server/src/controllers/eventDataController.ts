import { RequestHandler } from 'express';

import { EventData } from 'ontime-types';

import { removeUndefined } from '../utils/parserUtils.js';
import { failEmptyObjects } from '../utils/routerUtils.js';
import { DataProvider } from '../classes/data-provider/DataProvider.js';

// Create controller for GET request to 'event'
export const getEventData: RequestHandler = async (req, res) => {
  res.json(DataProvider.getEventData());
};

// Create controller for POST request to 'event'
export const postEventData: RequestHandler = async (req, res) => {
  if (failEmptyObjects(req.body, res)) {
    return;
  }

  try {
    const newEvent: Partial<EventData> = removeUndefined({
      title: req.body?.title,
      description: req.body?.description,
      publicUrl: req.body?.publicUrl,
      publicInfo: req.body?.publicInfo,
      backstageUrl: req.body?.backstageUrl,
      backstageInfo: req.body?.backstageInfo,
      endMessage: req.body?.endMessage,
    });
    const newData = await DataProvider.setEventData(newEvent);
    res.status(200).send(newData);
  } catch (error) {
    res.status(400).send(error);
  }
};
