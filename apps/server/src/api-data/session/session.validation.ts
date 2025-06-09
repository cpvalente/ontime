import type { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

export const validateGenerateUrl = [
  body('baseUrl').isString().trim().notEmpty(),
  body('path').isString().trim().notEmpty(),
  body('lock').isBoolean(),
  body('authenticate').isBoolean(),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(422).json({ errors: errors.array() });
      return;
    }
    next();
  },
];
