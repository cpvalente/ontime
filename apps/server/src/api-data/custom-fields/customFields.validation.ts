import { body, param } from 'express-validator';
import { customFieldTypes } from 'ontime-utils';

import { requestValidationFunction } from '../../middleware/validation.js';

// the service checks the label rule, it is shared with the MCP tools
export const validateCustomField = [
  body('label').isString(),
  body('type').isIn(customFieldTypes),
  body('colour').isString().trim(),

  requestValidationFunction,
];

export const validateEditCustomField = [
  param('key').isString().trim().notEmpty(),
  body('label').optional().isString(),
  body('colour').optional().isString().trim(),

  requestValidationFunction,
];

export const validateDeleteCustomField = [param('key').isString().notEmpty(), requestValidationFunction];

export const validateReorderCustomFields = [
  body('order').isArray(),
  body('order.*').isString().notEmpty(),

  requestValidationFunction,
];
