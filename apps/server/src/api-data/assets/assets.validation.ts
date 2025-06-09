import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

export const validatePostCss = [
  body('css').isString().trim(),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(422).json({ errors: errors.array() });
      return;
    }
    next();
  },
];
