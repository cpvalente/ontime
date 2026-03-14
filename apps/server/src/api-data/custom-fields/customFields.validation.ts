import { body, param } from 'express-validator';
import { checkRegex, customFieldLabelToKey, isObjectPrototypeKey } from 'ontime-utils';

import { requestValidationFunction } from '../validation-utils/validationFunction.js';

export const validateCustomField = [
  body('label')
    .isString()
    .trim()
    .notEmpty()
    .custom((value) => {
      return checkRegex.isAlphanumericWithSpace(value) && !isObjectPrototypeKey(customFieldLabelToKey(value));
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
      return checkRegex.isAlphanumericWithSpace(value) && !isObjectPrototypeKey(customFieldLabelToKey(value));
    }),
  body('type').isIn(['text', 'image']),
  body('colour').isString().trim(),

  requestValidationFunction,
];

export const validateDeleteCustomField = [param('key').isString().notEmpty(), requestValidationFunction];
