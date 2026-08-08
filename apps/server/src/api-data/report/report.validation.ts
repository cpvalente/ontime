import { body, param, query } from 'express-validator';

import { requestValidationFunction } from '../validation-utils/validationFunction.js';

export const validateRundownIdQuery = [
  query('rundownId').optional().isString().trim().notEmpty(),
  requestValidationFunction,
];

export const validateRunLabel = [
  param('id').isString().trim().notEmpty(),
  body('label').isString().trim().notEmpty(),
  requestValidationFunction,
];
