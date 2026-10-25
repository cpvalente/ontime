import { body, param } from 'express-validator';

import { requestValidationFunction } from '../../middleware/validation.js';
import { isValidCustomViewSlug } from './customViews.service.js';

const slugParam = param('slug')
  .isString()
  .trim()
  .notEmpty()
  .customSanitizer((value: string) => value.toLowerCase())
  .custom((value: string) => isValidCustomViewSlug(value))
  .withMessage('Invalid name. Use lowercase letters, numbers, and dashes only.');

export const validateCustomViewSlugParam = [slugParam, requestValidationFunction];

export const validateCustomViewPatch = [
  slugParam,
  body('displayInNav').custom((value: unknown) => typeof value === 'boolean'),
  requestValidationFunction,
];
