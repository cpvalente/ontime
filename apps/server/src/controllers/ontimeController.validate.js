import { body, check, validationResult } from 'express-validator';

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

/**
 * @description Validates object for POST /ontime/aliases
 */
export const validateAliases = [
  body().isArray(),
  body('*.enabled').isBoolean(),
  body('*.alias').isString().trim(),
  body('*.pathAndParams').isString().trim(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

/**
 * @description Validates object for POST /ontime/userfields
 */
export const validateUserFields = [
  body('user0').exists().isString().trim(),
  body('user1').exists().isString().trim(),
  body('user2').exists().isString().trim(),
  body('user3').exists().isString().trim(),
  body('user4').exists().isString().trim(),
  body('user5').exists().isString().trim(),
  body('user6').exists().isString().trim(),
  body('user7').exists().isString().trim(),
  body('user8').exists().isString().trim(),
  body('user9').exists().isString().trim(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

/**
 * @description Validates object for POST /ontime/settings
 */
export const validateSettings = [
  body('pinCode').isString().isLength({ min: 0, max: 4 }).optional({ nullable: true }),
  body('timeFormat').isString().isIn(['12', '24']),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

/**
 * @description Validates object for POST /ontime/osc
 */
export const validateOSC = [
  body('port').exists().isInt({ min: 0, max: 65353 }),
  body('portOut').exists().isInt({ min: 0, max: 65353 }),
  body('targetIP').exists().isIP(),
  body('enabled').exists().isBoolean(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];
