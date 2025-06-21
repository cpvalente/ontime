
import { body } from 'express-validator';
import { requestValidationFunction } from '../validation-utils/validationFunction.js';

export const validateGenerateUrl = [
  body('baseUrl').isString().trim().notEmpty(),
  body('path').isString().trim().notEmpty(),
  body('lock').isBoolean(),
  body('authenticate').isBoolean(),

  requestValidationFunction,
];
