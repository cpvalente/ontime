import { body } from 'express-validator';
import { requestValidationFunction } from '../validation-utils/validationFunction.js';

export const projectSanitiser = [
  body().notEmpty().withMessage('No object found in request'),
  body('title').optional().isString().trim(),
  body('description').optional().isString().trim(),
  body('publicUrl').optional().isString().trim(),
  body('publicInfo').optional().isString().trim(),
  body('backstageUrl').optional().isString().trim(),
  body('backstageInfo').optional().isString().trim(),
  body('endMessage').optional().isString().trim(),
  body('projectLogo').optional({ nullable: true }).isString().trim().isBase64(),
  body('custom').optional().isArray(),
  body('custom.*.title').optional().isString().trim().notEmpty(),
  body('custom.*.value').optional().isString().trim().notEmpty(),

  requestValidationFunction,
];
