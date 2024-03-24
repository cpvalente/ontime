import { isImportMap } from 'ontime-utils';

import { body, param, validationResult } from 'express-validator';
import { NextFunction, Request, Response } from 'express';

export const validateRequestConnection = [
  param('sheetId')
    .exists()
    .isString()
    .isLength({
      min: 40,
      max: 100,
    })
    .withMessage('Sheet ID is usually 44 characters long'),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

export const validateSheetId = [
  param('sheetId').exists().isString(),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

export const validateSheetOptions = [
  param('sheetId').exists().isString(),
  body('options')
    .exists()
    .isObject()
    .custom((content) => {
      const isValid = isImportMap(content);
      return isValid;
    }),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];
