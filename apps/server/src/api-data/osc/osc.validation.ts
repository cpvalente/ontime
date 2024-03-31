import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

import { sanitiseOscSubscriptions } from '../../utils/parserFunctions.js';

/**
 * @description Validates object for POST /ontime/osc
 */
export const validateOSC = [
  body('portIn').exists().isPort(),
  body('portOut').exists().isPort(),
  body('targetIP').exists().isIP(),
  body('enabledIn').exists().isBoolean(),
  body('enabledOut').exists().isBoolean(),
  body('subscriptions')
    .exists()
    .isArray()
    .custom((value) => sanitiseOscSubscriptions(value)),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];
