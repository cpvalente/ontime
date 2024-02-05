import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const projectSanitiser = [
  body('title').isString().trim(),
  body('description').optional().isString().trim(),
  body('publicUrl').optional().isString().trim(),
  body('publicInfo').optional().isString().trim(),
  body('backstageUrl').optional().isString().trim(),
  body('backstageInfo').optional().isString().trim(),
  body('endMessage').optional().isString().trim(),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];
