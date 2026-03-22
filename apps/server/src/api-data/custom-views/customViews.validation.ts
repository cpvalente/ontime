import { param } from 'express-validator';

import { requestValidationFunction } from '../validation-utils/validationFunction.js';
import { isValidCustomViewSlug } from './customViews.service.js';

export const validateCustomViewSlugParam = [
  param('slug')
    .isString()
    .trim()
    .notEmpty()
    .customSanitizer((value: string) => value.toLowerCase())
    .custom((value: string) => isValidCustomViewSlug(value))
    .withMessage('Invalid name. Use lowercase letters, numbers, and dashes only.'),

  requestValidationFunction,
];
