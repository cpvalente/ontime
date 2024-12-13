import { param, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const paramsMustHaveEventId = [
  param('eventId').exists(),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];
