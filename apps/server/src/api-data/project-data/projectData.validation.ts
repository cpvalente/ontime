import { body } from 'express-validator';
import { requestValidationFunction } from '../validation-utils/validationFunction.js';

export const projectSanitiser = [
  body().notEmpty().withMessage('No object found in request'),
  body('title').optional().isString().trim(),
  body('description').optional().isString().trim(),
  body('url').optional().isString().trim(),
  body('info').optional().isString().trim(),
  body('logo').optional({ nullable: true }).isString().trim(), //this is not the logo itself but then name of the logo
  body('custom').optional().isArray(),
  body('custom.*.title').optional().isString().trim().notEmpty(),
  body('custom.*.value').optional().isString().trim().notEmpty(),
  body('custom.*.url').optional().isString().trim().notEmpty(),

  requestValidationFunction,
];
