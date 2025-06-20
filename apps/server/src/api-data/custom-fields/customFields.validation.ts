import { isAlphanumericWithSpace } from 'ontime-utils';

import type { Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';

export const validateCustomField = [
  body('label')
    .isString()
    .trim()
    .notEmpty()
    .custom((value) => {
      return isAlphanumericWithSpace(value);
    }),
  body('type').isIn(['string', 'image']),
  body('colour').isString().trim(),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

export const validateEditCustomField = [
  param('key').isString().trim().notEmpty(),
  body('label')
    .isString()
    .trim()
    .notEmpty()
    .custom((value) => {
      return isAlphanumericWithSpace(value);
    }),
  body('type').isIn(['string', 'image']),
  body('colour').isString().trim(),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

export const validateDeleteCustomField = [
  param('key').isString().notEmpty(),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];
