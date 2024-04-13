import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

import { sanitiseHttpSubscriptions } from '../../utils/parserFunctions.js';

/**
 * @description Validates object for POST /ontime/http
 */
export const validateHTTP = [
  body('enabledOut').exists().isBoolean(),
  body('subscriptions')
    .exists()
    .isArray()
    .custom((value) => sanitiseHttpSubscriptions(value)),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];
