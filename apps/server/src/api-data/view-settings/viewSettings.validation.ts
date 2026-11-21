import { body } from 'express-validator';

import { requestValidationFunction } from '../../middleware/validation.js';

/**
 * @description Validates object for POST /ontime/views
 */
export const validateViewSettings = [
  body('overrideStyles').isBoolean().withMessage('overrideStyles value must be boolean'),

  requestValidationFunction,
];
