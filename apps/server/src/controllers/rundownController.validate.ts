import { body, param, validationResult } from 'express-validator';

export const rundownPostValidator = [
  body('type').isString().exists().isIn(['event', 'delay', 'block']),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

export const rundownPutValidator = [
  body('id').isString().exists(),
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
