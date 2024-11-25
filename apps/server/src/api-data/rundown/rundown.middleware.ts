import { eventStore } from '../../stores/EventStore.js';
import { type OntimeEvent } from 'ontime-types';

export const freezeFields: Array<keyof OntimeEvent> = [
  'linkStart',
  'timerType',
  'timeStrategy',
  'timeStart',
  'duration',
  'timeEnd',
  'endAction',
  'isPublic',
  'cue',
  'title',
];

export const preventIfFrozen = function (req, res, next) {
  if (eventStore.get('frozen')) {
    res.status(403).send({ message: 'Rundown is frozen' });
  } else {
    next();
  }
};

export const preventPutIfFrozen = function (req, res, next) {
  const editFields = Object.keys(req.body);
  if (
    eventStore.get('frozen') &&
    freezeFields.some((field) => {
      return editFields.includes(field);
    })
  ) {
    res.status(403).send({ message: 'Rundown is frozen' });
  } else {
    next();
  }
};

export const preventBatchIfFrozen = function (req, res, next) {
  const editFields = Object.keys(req.body['data']);
  if (
    eventStore.get('frozen') &&
    freezeFields.some((field) => {
      return editFields.includes(field);
    })
  ) {
    res.status(403).send({ message: 'Rundown is frozen' });
  } else {
    next();
  }
};
