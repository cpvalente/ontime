import { body, check, validationResult } from 'express-validator';
import { validateOscObject, validateOscSubscriptionEntry } from '../utils/parserFunctions.js';

/**
 * @description Validates object for POST /ontime/views
 */
export const viewValidator = [
  check('overrideStyles').isBoolean().withMessage('overrideStyles value must be boolean'),
  check('endMessage').isString().trim().withMessage('endMessage value must be string'),
  check('normalColor').isString().trim().withMessage('normalColor value must be string'),
  check('warningColor').isString().trim().withMessage('warningColor value must be string'),
  check('dangerColor').isString().trim().withMessage('dangerColor value must be string'),
  check('warningThreshold').isNumeric().withMessage('warningThreshold value must be a number'),
  check('dangerThreshold').isNumeric().withMessage('dangerThreshold value must a number'),
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
  body('editorKey').isString().isLength({ min: 0, max: 4 }).optional({ nullable: true }),
  body('operatorKey').isString().isLength({ min: 0, max: 4 }).optional({ nullable: true }),
  body('timeFormat').isString().isIn(['12', '24']),
  body('language').isString(),
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
  body('portIn').exists().isInt({ min: 1024, max: 65535 }),
  body('portOut').exists().isInt({ min: 1024, max: 65535 }),
  body('targetIP').exists().isIP(),
  body('enabledIn').exists().isBoolean(),
  body('enabledOut').exists().isBoolean(),
  body('subscriptions')
    .isObject()
    .custom((value) => validateOscObject(value)),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

/**
 * @description Validates object for POST /ontime/osc-subscriptions
 */
export const validateOscSubscription = [
  body('onLoad')
    .isArray()
    .custom((value) => validateOscSubscriptionEntry(value)),
  body('onStart')
    .isArray()
    .custom((value) => validateOscSubscriptionEntry(value)),
  body('onPause')
    .isArray()
    .custom((value) => validateOscSubscriptionEntry(value)),
  body('onStop')
    .isArray()
    .custom((value) => validateOscSubscriptionEntry(value)),
  body('onUpdate')
    .isArray()
    .custom((value) => validateOscSubscriptionEntry(value)),
  body('onFinish')
    .isArray()
    .custom((value) => validateOscSubscriptionEntry(value)),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];
