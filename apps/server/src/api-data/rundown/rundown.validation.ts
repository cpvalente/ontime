import { body, param } from 'express-validator';
import { requestValidationFunction } from '../validation-utils/validationFunction.js';

export const rundownPostValidator = [
  body('type').isString().isIn(['event', 'delay', 'block']),
  body('after').optional().isString(),
  body('before').optional().isString(),

  requestValidationFunction,
];

export const rundownPutValidator = [body('id').isString().notEmpty(), requestValidationFunction];

export const rundownBatchPutValidator = [
  body('data').isObject(),
  body('ids').isArray().notEmpty(),
  body('ids.*').isString(),

  requestValidationFunction,
];

export const rundownReorderValidator = [
  body('entryId').isString().notEmpty(),
  body('destinationId').isString().notEmpty(),
  body('order').isIn(['before', 'after', 'insert']),

  requestValidationFunction,
];

export const rundownSwapValidator = [
  body('from').isString().notEmpty(),
  body('to').isString().notEmpty(),

  requestValidationFunction,
];

export const paramsMustHaveEntryId = [param('entryId').isString().notEmpty(), requestValidationFunction];

export const rundownArrayOfIds = [
  body('ids').isArray().notEmpty(),
  body('ids.*').isString(),

  requestValidationFunction,
];
