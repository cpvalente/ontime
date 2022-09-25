import { removeUndefined } from '../utils/parserUtils.js';
import { failEmptyObjects } from '../utils/routerUtils.js';
import { DataProvider } from '../classes/data-provider/DataProvider.js';

// Create controller for GET request to 'event'
export const getEvent = async (req, res) => {
  res.json(DataProvider.getEvent());
};

// Create controller for POST request to 'event'
export const postEvent = async (req, res) => {
  if (failEmptyObjects(req.body, res)) {
    return;
  }

  try {
    const newEvent = removeUndefined({
      title: req.body?.title,
      url: req.body?.url,
      publicInfo: req.body?.publicInfo,
      backstageInfo: req.body?.backstageInfo,
      endMessage: req.body?.endMessage,
    });
    const newData = await DataProvider.setEvent(newEvent);
    res.status(200).send(newData);
  } catch (error) {
    res.status(400).send(error);
  }
};
