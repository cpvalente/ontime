import { body, param } from 'express-validator';
import { checkRegex, customFieldLabelToKey, isReservedCustomFieldKey } from 'ontime-utils';

import { requestValidationFunction } from '../../middleware/validation.js';

function isValidLabel(value: string): boolean {
  return checkRegex.isAlphanumericWithSpace(value) && !isReservedCustomFieldKey(customFieldLabelToKey(value));
}

export const validateCustomField = [
  body('label').isString().trim().notEmpty().custom(isValidLabel),
  body('type').isIn(['text', 'image']),
  body('colour').isString().trim(),

  requestValidationFunction,
];

export const validateEditCustomField = [
  param('key').isString().trim().notEmpty(),
  body('label').isString().trim().notEmpty().custom(isValidLabel),
  body('type').isIn(['text', 'image']),
  body('colour').isString().trim(),

  requestValidationFunction,
];

export const validateDeleteCustomField = [param('key').isString().notEmpty(), requestValidationFunction];

export const validateReorderCustomFields = [
  body('order').isArray(),
  body('order.*').isString().notEmpty(),

  requestValidationFunction,
];
