import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

/**
 * @description Validates object
 */
export const validateCompanion = [
  body('portOut').exists().isPort(),
  body('targetIP').exists().isIP(),
  body('enabledOut').exists().isBoolean(),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];
