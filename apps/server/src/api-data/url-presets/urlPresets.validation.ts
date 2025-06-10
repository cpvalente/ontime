import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { requestValidationFunction } from '../validation-utils/validationFunction.js';

/**
 * validate array of URL preset objects
 */
export const validateUrlPresets = [
  body().isArray().withMessage('No array found in request'),
  body('*.enabled').isBoolean(),
  body('*.alias').isString().trim().notEmpty(),
  body('*.pathAndParams').isString().trim().notEmpty(),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(422).json({ errors: errors.array() });
      return;
    }
    next();
  },
];
