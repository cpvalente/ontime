import { body, validationResult } from 'express-validator';

export const eventSanitizer = [
  body('title').optional().isString().trim().escape(),
  body('url').optional().isString().trim().escape(),
  body('publicInfo').optional().isString().trim().escape(),
  body('backstageInfo').optional().isString().trim().escape(),
  body('endMessage').optional().isString().trim().escape(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];
