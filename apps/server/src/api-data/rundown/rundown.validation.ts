import type { Request, Response, NextFunction } from 'express';
import { body, param } from 'express-validator';

import { requestValidationFunction } from '../validation-utils/validationFunction.js';
import { getCurrentRundown } from './rundown.dao.js';

// #region operations on project rundowns =========================

export const rundownPostValidator = [body('title').isString().trim().notEmpty(), requestValidationFunction];

// #endregion operations on project rundowns ======================
// #region operations on rundown entries ==========================

/**
 * Middleware prevents mutating a rundown that is not selected
 * This allows our service to still only handle the current rundown
 *
 * This would need to be removed in favour or rundown selection if we would like
 * to implement the mutation of background rundowns
 */
export async function validateRundownMutation(req: Request, res: Response, next: NextFunction) {
  const { rundownId } = req.params;

  try {
    if (getCurrentRundown().id !== rundownId) {
      res.status(404).json({ message: 'Cannot mutate not selected rundown' });
      return;
    }

    next();
  } catch (_error) {
    res.status(404).json({ message: 'Rundown not found' });
    return;
  }
}

export const entryPostValidator = [
  body('type').isString().isIn(['event', 'delay', 'group', 'milestone']),
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
