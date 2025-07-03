import { body } from 'express-validator';
import { requestValidationFunction } from '../validation-utils/validationFunction.js';

export const validateGenerateUrl = [
  body('baseUrl').isString().trim().notEmpty(),
  body('path').isString().trim(),
  body('lock').isBoolean(),
  body('authenticate').isBoolean(),

  requestValidationFunction,
];
