import { body } from 'express-validator';
import { requestValidationFunction } from '../validation-utils/validationFunction.js';

/**
 * validate array of URL preset objects
 */
export const validateUrlPresets = [
  body().isArray().withMessage('No array found in request'),
  body('*.enabled').isBoolean(),
  body('*.alias').isString().trim().notEmpty(),
  body('*.pathAndParams').isString().trim().notEmpty(),

  requestValidationFunction,
];
