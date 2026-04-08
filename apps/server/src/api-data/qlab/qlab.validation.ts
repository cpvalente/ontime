import { body, validationResult } from 'express-validator';
import type { Request, Response, NextFunction } from 'express';

export const validateQlabSettings = [
  body('enabled').isBoolean(),
  body('host').isString().notEmpty(),
  body('port').isInt({ min: 1, max: 65535 }),
  body('listenPort').isInt({ min: 1, max: 65535 }),
  body('filterByColor').optional({ nullable: true }).isString(),
  body('filterByType').optional({ nullable: true }).isString(),
  body('filterByCueNumber').optional({ nullable: true }).isString(),
  body('warningThreshold').isInt({ min: 0 }),
  body('dangerThreshold').isInt({ min: 0 }),
  body('timeout').isInt({ min: 1000 }),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];
