import { body } from 'express-validator';

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
  body('auxTimerNames')
    .isArray()
    .withMessage('auxTimerNames must be an array')
    .customSanitizer((value: unknown) => {
      // normalise to a fixed-length array of trimmed strings
      const source = Array.isArray(value) ? value : [];
      return [0, 1, 2].map((index) => (typeof source[index] === 'string' ? source[index].trim() : ''));
    }),

  requestValidationFunction,
];

export const validateServerPort = [
  body('serverPort').isPort().withMessage('Invalid value found for server port').toInt(),
  requestValidationFunction,
];
