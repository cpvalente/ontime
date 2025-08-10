import { body } from 'express-validator';
import { requestValidationFunction } from '../validation-utils/validationFunction.js';

export const validatePostCss = [body('css').isString().trim(), requestValidationFunction];

export const validatePostTranslation = [
  body('translation')
    .custom((v) => v != null && typeof v === 'object' && !Array.isArray(v))
    .withMessage('translation must be an object (key -> string)')
    .bail(),
  body('translation.*').isString().trim().notEmpty(),
  requestValidationFunction,
];
