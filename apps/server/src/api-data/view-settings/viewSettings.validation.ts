import { check, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

/**
 * @description Validates object for POST /ontime/views
 */
export const validateViewSettings = [
  check('dangerColor').exists().isString().trim().withMessage('dangerColor value must be string'),
  check('endMessage').exists().isString().trim().withMessage('endMessage value must be string'),
  check('freezeEnd').exists().isBoolean().withMessage('freezeEnd value must be boolean'),
  check('normalColor').exists().isString().trim().withMessage('normalColor value must be string'),
  check('overrideStyles').exists().isBoolean().withMessage('overrideStyles value must be boolean'),
  check('warningColor').exists().isString().trim().withMessage('warningColor value must be string'),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];
