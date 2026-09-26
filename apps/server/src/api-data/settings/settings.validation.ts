import { body } from 'express-validator';
import { isValidTimezone, sanitiseAuxTimerNames } from 'ontime-utils';

import { requestValidationFunction } from '../validation-utils/validationFunction.js';

/**
 * @description Validates object for POST /ontime/settings/welcomedialog
 */
export const validateWelcomeDialog = [body('show').isBoolean(), requestValidationFunction];

const pinValidator = (key: string) => {
  return body(key)
    .optional()
    .isLength({ min: 0, max: 4 })
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
  body('productionTimezone')
    .customSanitizer((input) => (typeof input === 'string' && input.length > 0 ? input : null))
    .custom((input) => input === null || isValidTimezone(input))
    .withMessage('Production timezone must be a valid IANA timezone'),
  body('auxTimerNames').isArray().withMessage('auxTimerNames must be an array').customSanitizer(sanitiseAuxTimerNames),

  requestValidationFunction,
];

export const validateServerPort = [
  body('serverPort').isPort().withMessage('Invalid value found for server port').toInt(),
  requestValidationFunction,
];
