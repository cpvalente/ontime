import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

export const projectSanitiser = [
  body('title').optional().isString().trim(),
  body('description').optional().isString().trim(),
  body('publicUrl').optional().isString().trim(),
  body('publicInfo').optional().isString().trim(),
  body('backstageUrl').optional().isString().trim(),
  body('backstageInfo').optional().isString().trim(),
  body('endMessage').optional().isString().trim(),
  body('projectLogo').optional({ nullable: true }).isString().trim(),
  body('custom').optional().isArray(),
  body('custom.*.title').optional().isString().trim().notEmpty(),
  body('custom.*.value').optional().isString().trim().notEmpty(),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(422).json({ errors: errors.array() });
      return;
    }
    next();
  },
];
