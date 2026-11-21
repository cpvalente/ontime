import { body, param } from 'express-validator';
import { customFieldTypes } from 'ontime-utils';

import { requestValidationFunction } from '../../middleware/validation.js';

// the service checks the label and options rules, they are shared with the MCP tools
export const validateCustomField = [
  body('label').isString(),
  body('type').isIn(customFieldTypes),
  body('colour').isString().trim(),
  body('options').optional().isArray(),

  requestValidationFunction,
];

export const validateEditCustomField = [
  param('key').isString().trim().notEmpty(),
  body('label').optional().isString(),
  body('colour').optional().isString().trim(),
  body('options').optional().isArray(),
  body('renamedOptions').optional().isObject(),
  body('previousOptions').optional().isArray(),
  body('previousOptions.*').isString(),

  requestValidationFunction,
];

export const validateDeleteCustomField = [param('key').isString().notEmpty(), requestValidationFunction];

export const validateReorderCustomFields = [
  body('order').isArray(),
  body('order.*').isString().notEmpty(),

  requestValidationFunction,
];
