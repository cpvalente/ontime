import { check, validationResult } from 'express-validator';

/**
 * @description Validates object for POST /ontime/views
 */
export const viewValidator = [
  check('overrideStyles').isBoolean().withMessage('overrideStyles value must be boolean'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];
