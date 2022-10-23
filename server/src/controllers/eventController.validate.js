import { body, validationResult } from 'express-validator';

export const eventSanitizer = [
  body('title').optional().isString().trim(),
  body('url').optional().isString().trim(),
  body('publicInfo').optional().isString().trim(),
  body('backstageInfo').optional().isString().trim(),
  body('endMessage').optional().isString().trim(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];
