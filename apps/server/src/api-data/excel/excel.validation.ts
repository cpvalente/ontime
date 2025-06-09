import { isImportMap } from 'ontime-utils';

import { body, validationResult } from 'express-validator';
import type { NextFunction, Request, Response } from 'express';

export const validateFileExists = [
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
      res.status(422).json({ errors: 'File not found' });
      return;
    }
    next();
  },
];

export const validateImportMapOptions = [
  body('options')
    .isObject()
    .custom((content) => {
      return isImportMap(content);
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
