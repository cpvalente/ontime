import { removeUndefined } from '../utils/parserUtils.js';
import { failEmptyObjects } from '../utils/routerUtils.js';
import { DataProvider } from '../classes/data-provider/DataProvider.js';

// Create controller for GET request to 'event'
export const getEventData = async (req, res) => {
  res.json(DataProvider.getEventData());
};

// Create controller for POST request to 'event'
export const postEventData = async (req, res) => {
  if (failEmptyObjects(req.body, res)) {
    return;
  }

  try {
    const newEvent = removeUndefined({
      title: req.body?.title,
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
