import { isImportMap } from 'ontime-utils';

import { body, param, validationResult } from 'express-validator';
import { NextFunction, Request, Response } from 'express';

export const validateRequestConnection = [
  param('sheetId')
    .isString()
    .isLength({
      min: 20,
      max: 100,
    })
    .withMessage('Sheet ID is usually 44 characters long'),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(422).json({ errors: errors.array() });
      return;
    }
    // check that the file exists
    if (!req.file) {
      res.status(422).json({ errors: 'File not found' });
      return;
    }
    next();
  },
];

export const validateSheetId = [
  param('sheetId').isString().trim().notEmpty(),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(422).json({ errors: errors.array() });
    } else {
      next();
    }
  },
];

export const validateSheetOptions = [
  param('sheetId').isString().trim().notEmpty(),
  body('options')
    .isObject()
    .custom((content) => {
      const isValid = isImportMap(content);
      return isValid;
    }),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(422).json({ errors: errors.array() });
      return;
    }
    next();
  },
];
