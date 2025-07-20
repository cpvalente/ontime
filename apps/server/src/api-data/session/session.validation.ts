import { body } from 'express-validator';
import { requestValidationFunction } from '../validation-utils/validationFunction.js';

export const validateGenerateUrl = [
  body('baseUrl').isString().trim().notEmpty(),
  body('path').isString().trim().notEmpty(),

  body('authenticate').isBoolean(),
  body('lockConfig').isBoolean(),
  body('lockNav').isBoolean(),
  body('preset').optional().isString().trim().notEmpty(),
  body('prefix').optional().isString().trim().notEmpty(),
  body('hash').optional().isString().trim().notEmpty(),

  requestValidationFunction,
];
