import { body, param } from 'express-validator';
import type { EntryId, InsertOptions, OntimeGroup, Rundown } from 'ontime-types';

import { requestValidationFunction } from '../validation-utils/validationFunction.js';

// #region operations on project rundowns =========================

export const rundownPostValidator = [body('title').isString().trim().notEmpty(), requestValidationFunction];
export const rundownPatchValidator = [
  param('id').isString().trim().notEmpty(),
  body('title').isString().trim().notEmpty().withMessage('No title provided'),
  requestValidationFunction,
];

export const rundownImportValidator = [
  body('mode').isString().isIn(['override', 'merge', 'new']),
  body('targetRundownId')
    .if(body('mode').isIn(['override', 'merge']))
    .isString()
    .trim()
    .notEmpty()
    .withMessage('targetRundownId is required when mode is override or merge'),
  body('rundown').isObject(),
  body('rundown.entries').isObject(),
  body('rundown.order').isArray(),
  body('rundown.flatOrder').isArray(),
  body('customFields').isObject(),
  body('providedFields').optional().isObject(),
  body('providedFields.event').optional().isArray(),
  body('providedFields.event.*').isString(),
  body('providedFields.custom').optional().isArray(),
  body('providedFields.custom.*').isString(),
  requestValidationFunction,
];

// #endregion operations on project rundowns ======================
// #region operations on rundown entries ==========================

export const entryPostValidator = [
  body('type').isString().isIn(['event', 'delay', 'group', 'milestone']),
  body('after')
    .optional()
    .custom((value) => value === true || typeof value === 'string')
    .withMessage('Allowed values for after are an ID or true.'),
  body('before')
    .optional()
    .custom((value) => value === true || typeof value === 'string')
    .withMessage('Allowed values for before are an ID or true.'),

  requestValidationFunction,
];

export const clonePostValidator = [
  body('after')
    .optional()
    .custom((value) => value === true || typeof value === 'string')
    .withMessage('Allowed values for after are an ID or true.'),
  body('before')
    .optional()
    .custom((value) => value === true || typeof value === 'string')
    .withMessage('Allowed values for before are an ID or true.'),

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

export const entryRenumberValidator = [
  body('ids').isArray().notEmpty(),
  body('ids.*').isString(),
  body('prefix').isString(),
  body('start').isDecimal(),
  body('increment').isDecimal(),
  requestValidationFunction,
];

/**
 * Ensures callers use a single insertion anchor so placement is unambiguous.
 */
export function assertSingleInsertAnchor(options: InsertOptions) {
  if (options.after !== undefined && options.before !== undefined) {
    throw new Error('Use only one insertion anchor: after or before');
  }
}

/**
 * Ensures an ID anchor exists and belongs to the order it is intended to position within.
 */
export function assertInsertAnchorInOrder(rundown: Rundown, parent: OntimeGroup | null, options: InsertOptions) {
  const anchor = getStringInsertAnchor(options);
  if (anchor === undefined) return;

  if (!Object.hasOwn(rundown.entries, anchor)) {
    throw new Error(`Insertion anchor with ID ${anchor} does not exist`);
  }

  const insertionList = parent ? parent.entries : rundown.order;
  if (!insertionList.includes(anchor)) {
    throw new Error(`Insertion anchor with ID ${anchor} is not in the target order`);
  }
}

/** Ensures an ID anchor refers to an entry in the rundown. */
export function assertInsertAnchorExists(rundown: Rundown, options: InsertOptions) {
  const anchor = getStringInsertAnchor(options);
  if (anchor !== undefined && !Object.hasOwn(rundown.entries, anchor)) {
    throw new Error(`Insertion anchor with ID ${anchor} does not exist`);
  }
}

function getStringInsertAnchor(options: InsertOptions): EntryId | undefined {
  if (typeof options.after === 'string') return options.after;
  if (typeof options.before === 'string') return options.before;
  return undefined;
}

// #endregion operations on rundown entries =======================
