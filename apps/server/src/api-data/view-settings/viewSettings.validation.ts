import { body } from 'express-validator';

import { requestValidationFunction } from '../validation-utils/validationFunction.js';

/**
 * @description Validates object for POST /ontime/views
 */
export const validateViewSettings = [
  body('dangerColor').isString().trim().withMessage('dangerColor value must be string'),
  body('normalColor').isString().trim().withMessage('normalColor value must be string'),
  body('overrideStyles').isBoolean().withMessage('overrideStyles value must be boolean'),
  body('warningColor').isString().trim().withMessage('warningColor value must be string'),

  requestValidationFunction,
];
