import { defaultExcelImportMap } from 'ontime-utils';

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

export const validateSheetOptions = [
  param('sheetId').exists().isString(),
  body('options')
    .exists()
    .isObject()
    .custom((content) => {
      // Check if the fileContent has the same keys as defaultExcelImportMap
      const hasValidKeys = Object.keys(defaultExcelImportMap).every((key) => key in content);

      // Check if all values in fileContent are strings
      const hasValidValues = Object.values(content).every((value) => typeof value === 'string');

      if (!hasValidKeys || !hasValidValues) {
        throw new Error('Invalid file format');
      }

      return true;
    }),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];
