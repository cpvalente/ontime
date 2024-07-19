import { eventStore } from '../../stores/EventStore.js';

export const preventIfFrozen = function (req, res, next) {
  if (eventStore.get('frozen')) {
    res.status(403).send({ message: 'Rundown is frozen' });
  } else {
    next();
  }
};
