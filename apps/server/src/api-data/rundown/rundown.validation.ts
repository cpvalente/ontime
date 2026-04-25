import { body, param } from 'express-validator';

import { requestValidationFunction } from '../validation-utils/validationFunction.js';

// #region operations on project rundowns =========================

export const rundownPostValidator = [body('title').isString().trim().notEmpty(), requestValidationFunction];

// #endregion operations on project rundowns ======================
// #region operations on rundown entries ==========================

export const entryPostValidator = [
  body('type').isString().isIn(['event', 'delay', 'group', 'milestone']),
  body('after').optional().isString(),
  body('before').optional().isString(),

  requestValidationFunction,
];

export const clonePostValidator = [
  body('after').optional().isString(),
  body('before').optional().isString(),

  requestValidationFunction,
];

export const entryPutValidator = [body('id').isString().trim().notEmpty(), requestValidationFunction];

export const entryBatchPutValidator = [
  body('data').isObject(),
  body('ids').isArray().notEmpty(),
  body('ids.*').isString(),

  requestValidationFunction,
];

export const entryReorderValidator = [
  body('entryId').isString().notEmpty(),
  body('destinationId').isString().notEmpty(),
  body('order').isIn(['before', 'after', 'insert']),

  requestValidationFunction,
];

export const entrySwapValidator = [
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

// #endregion operations on rundown entries =======================
