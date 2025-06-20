import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

/**
 * validate array of URL preset objects
 */
export const validateUrlPresets = [
  body().isArray(),
  body('*.enabled').isBoolean(),
  body('*.alias').isString().trim(),
  body('*.pathAndParams').isString().trim(),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];
