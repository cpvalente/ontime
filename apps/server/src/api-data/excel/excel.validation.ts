import { isImportMap } from 'ontime-utils';

import { body, param, validationResult } from 'express-validator';
import { NextFunction, Request, Response } from 'express';


export const validateFileId = [
  param('fileId').exists().isString(),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

export const validateImportMapOptions = [
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
