import { isImportMap } from 'ontime-utils';

import { body, validationResult } from 'express-validator';
import { NextFunction, Request, Response } from 'express';

export const validateFileExists = [
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
      return res.status(422).json({ errors: 'File not found' });
    }
    next();
  },
];

export const validateImportMapOptions = [
  body('options')
    .exists()
    .isObject()
    .custom((content) => {
      return isImportMap(content);
    }),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];
