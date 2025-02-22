import { body, validationResult } from 'express-validator';
import type { Request, Response, NextFunction } from 'express';
import { coerceEnum } from '../../utils/coerceType.js';
import { OffsetMode } from 'ontime-types';

/**
 * @description Validates object for POST /ontime/settings/welcomedialog
 */
export const validateWelcomeDialog = [
  body('show').exists().isBoolean(),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

/**
 * @description Validates object for POST /ontime/settings/offsetmode
 */
export const validateOffsetMode = [
  body('mode')
    .exists()
    .isString()
    .custom((input: unknown) => coerceEnum(input, OffsetMode)),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

/**
 * @description Validates object for POST /ontime/settings
 */
export const validateSettings = [
  body('editorKey').isString().isLength({ min: 0, max: 4 }).optional({ nullable: true }),
  body('operatorKey').isString().isLength({ min: 0, max: 4 }).optional({ nullable: true }),
  body('timeFormat').isString().isIn(['12', '24']),
  body('language').isString(),
  body('serverPort').isPort().optional(),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];
