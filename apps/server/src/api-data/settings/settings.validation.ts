import { body } from 'express-validator';
import { regex, sanitiseAuxTimerNames } from 'ontime-utils';

import { requestValidationFunction } from '../../middleware/validation.js';

/**
 * @description Validates object for POST /ontime/settings/welcomedialog
 */
export const validateWelcomeDialog = [body('show').isBoolean(), requestValidationFunction];

const pinValidator = (key: string) => {
  return body(key)
    .optional()
    .custom((input) => input === null || typeof input === 'string')
    .withMessage(`${key} must be a string or null`)
    .isLength({ min: 0, max: 4 })
    .matches(regex.isAlphanumericOrEmpty)
    .withMessage(`${key} can only contain alphanumeric characters`)
    .customSanitizer((input) => {
      if (input === null || input.length === 0) {
        return null;
      }
      return input;
    });
};

/**
 * @description Validates object for POST /ontime/settings
 */
export const validateSettings = [
  pinValidator('editorKey'),
  pinValidator('operatorKey'),
  body('timeFormat').isString().isIn(['12', '24']).withMessage('Time format can only be "12" or "24"'),
  body('language').isString().trim().notEmpty(),
  body('auxTimerNames').isArray().withMessage('auxTimerNames must be an array').customSanitizer(sanitiseAuxTimerNames),

  requestValidationFunction,
];

export const validateServerPort = [
  body('serverPort').isPort().withMessage('Invalid value found for server port').toInt(),
  requestValidationFunction,
];
