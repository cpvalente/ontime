import { checkRegex } from 'ontime-utils';

import { body, param } from 'express-validator';
import { requestValidationFunction } from '../validation-utils/validationFunction.js';

export const validateCustomField = [
  body('label')
    .isString()
    .trim()
    .notEmpty()
    .custom((value) => {
      return checkRegex.isAlphanumericWithSpace(value);
    }),
  body('type').isIn(['text', 'image']),
  body('colour').isString().trim(),

  requestValidationFunction,
];

export const validateEditCustomField = [
  param('key').isString().trim().notEmpty(),
  body('label')
    .isString()
    .trim()
    .notEmpty()
    .custom((value) => {
      return checkRegex.isAlphanumericWithSpace(value);
    }),
  body('type').isIn(['text', 'image']),
  body('colour').isString().trim(),

  requestValidationFunction,
];

export const validateDeleteCustomField = [param('key').isString().notEmpty(), requestValidationFunction];
