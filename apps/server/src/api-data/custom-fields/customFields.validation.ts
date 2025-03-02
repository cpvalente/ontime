import { isAlphanumericWithSpace } from 'ontime-utils';

import type { Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';

export const validateCustomField = [
  body('label')
    .exists()
    .isString()
    .trim()
    .custom((value) => {
      return isAlphanumericWithSpace(value);
    }),
  body('type').exists().isIn(['string', 'image']),
  body('colour').exists().isString().trim(),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

export const validateEditCustomField = [
  param('label').exists().isString().trim(),
  body('label')
    .exists()
    .isString()
    .trim()
    .custom((value) => {
      return isAlphanumericWithSpace(value);
    }),
  body('type').exists().isIn(['string', 'image']),
  body('colour').exists().isString().trim(),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

export const validateDeleteCustomField = [
  param('label').exists().isString(),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];
