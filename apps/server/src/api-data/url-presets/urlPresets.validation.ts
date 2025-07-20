import { OntimeView } from 'ontime-types';

import { body, param } from 'express-validator';

import { requestValidationFunction } from '../validation-utils/validationFunction.js';

/**
 * validate array of URL preset objects
 */
export const validateNewPreset = [
  body().isObject().withMessage('No data found in request'),
  body('enabled').isBoolean(),
  body('alias').isString().trim().notEmpty(),
  body('target').isString().trim().notEmpty().isIn(Object.values(OntimeView)),
  body('search').isString().trim(),

  requestValidationFunction,
];

export const validateUpdatePreset = [
  param('alias').isString().trim().notEmpty(),
  body().isObject().withMessage('No data found in request'),
  body('enabled').isBoolean(),
  body('alias').isString().trim().notEmpty(),
  body('target').isString().trim().notEmpty().isIn(Object.values(OntimeView)),
  body('search').isString().trim(),

  requestValidationFunction,
];

export const validatePresetParam = [param('alias').isString().trim().notEmpty(), requestValidationFunction];
