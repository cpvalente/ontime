import { isAlphanumeric } from 'ontime-utils';

import { Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';

export const validateCustomField = [
  body('label')
    .exists()
    .isString()
    .trim()
    .custom((value) => {
      return isAlphanumeric(value);
    }),
  body('type').exists().isString().trim(),
  body('colour').exists().isString().trim(),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

export const validateEditCustomField = [
  param('label').exists().isString().trim(),
  body('label').exists().isString().trim(),
  body('type').exists().isString().trim(),
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
