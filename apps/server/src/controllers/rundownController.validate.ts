import { body, param, validationResult } from 'express-validator';
import { SupportedEvent } from 'ontime-types';
import { enum_, object, unknown, string, array } from 'valibot';

export const postEvent = object(
  {
    type: enum_(SupportedEvent, 'Invalid event type'),
  },
  unknown(),
);

export const putEvent = object(
  {
    id: string('Must include an ID'),
  },
  unknown(),
);

export const putBatchEvent = object({
  data: object({}, unknown(), 'Must batch object'),
  ids: array(string(), 'Must include an IDs'),
});

export const rundownBatchPutValidator = [
  body('data').isObject().exists(),
  body('ids').isArray().exists(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

export const rundownReorderValidator = [
  body('eventId').isString().exists(),
  body('from').isNumeric().exists(),
  body('to').isNumeric().exists(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

export const rundownSwapValidator = [
  body('from').isString().exists(),
  body('to').isString().exists(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

export const paramsMustHaveEventId = [
  param('eventId').exists(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];
