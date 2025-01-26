import type { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

export const validateGenerateUrl = [
  body('baseUrl').exists().isString().notEmpty().trim(),
  body('path').exists().isString().notEmpty().trim(),
  body('lock').exists().isBoolean(),
  body('authenticate').exists().isBoolean(),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];
