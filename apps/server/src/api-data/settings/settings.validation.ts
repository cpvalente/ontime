import { body } from 'express-validator';
import { requestValidationFunction } from '../validation-utils/validationFunction.js';

/**
 * @description Validates object for POST /ontime/settings/welcomedialog
 */
export const validateWelcomeDialog = [body('show').isBoolean(), requestValidationFunction];

/**
 * @description Validates object for POST /ontime/settings
 */
export const validateSettings = [
  body().notEmpty().withMessage('No object found in request'),
  body('editorKey').isString().isLength({ min: 0, max: 4 }).optional({ nullable: true }),
  body('operatorKey').isString().isLength({ min: 0, max: 4 }).optional({ nullable: true }),
  body('timeFormat').isString().isIn(['12', '24']),
  body('language').isString(),
  body('serverPort').isPort().optional(),

  requestValidationFunction,
];
