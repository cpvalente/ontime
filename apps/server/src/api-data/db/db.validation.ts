import { body, param } from 'express-validator';
import sanitize from 'sanitize-filename';

import { ensureJsonExtension } from '../../utils/fileManagement.js';
import { requestValidationFunction } from '../validation-utils/validationFunction.js';

/**
 * @description Validates request for a new project.
 */
export const validateNewProject = [
  body().notEmpty().withMessage('No object found in request'),
  body('filename').optional().isString().trim(),
  body('title').optional().isString().trim(),
  body('description').optional().isString().trim(),
  body('url').optional().isString().trim(),
  body('info').optional().isString().trim(),
  body('logo').optional().isString().trim(),
  body('custom').optional().isArray(),

  requestValidationFunction,
];

/**
 * @description Validates request for a quick project.
 */
export const validateQuickProject = [
  // Project fields
  body('project.title').isString().trim(),

  // Settings fields
  body('settings.timeFormat').optional().isIn(['12', '24']),
  body('settings.language').optional().isString().trim(),

  requestValidationFunction,
];

/**
 * @description Validates request for pathing data in the project.
 */
export const validatePatchProject = [
  body().notEmpty().withMessage('No object found in request'),
  body('rundowns').isObject().optional({ nullable: false }),
  body('project').isObject().optional({ nullable: false }),
  body('settings').isObject().optional({ nullable: false }),
  body('viewSettings').isObject().optional({ nullable: false }),
  body('urlPresets').isArray().optional({ nullable: false }),
  body('customFields').isObject().optional({ nullable: false }),
  body('osc').isObject().optional({ nullable: false }),
  body('http').isObject().optional({ nullable: false }),

  requestValidationFunction,
];

/**
 * @description Validates request with newFilename in the body.
 */
export const validateNewFilenameBody = [
  body('newFilename')
    .isString()
    .trim()
    .customSanitizer((input: string) => sanitize(input))
    .withMessage('Failed to sanitize the filename')
    .notEmpty()
    .withMessage('Filename was empty or contained only invalid characters')
    .customSanitizer((input: string) => ensureJsonExtension(input)),

  requestValidationFunction,
];

/**
 * @description Validates request with filename in the body.
 */
export const validateFilenameBody = [
  body('filename')
    .isString()
    .trim()
    .customSanitizer((input: string) => sanitize(input))
    .withMessage('Failed to sanitize the filename')
    .notEmpty()
    .withMessage('Filename was empty or contained only invalid characters')
    .customSanitizer((input: string) => ensureJsonExtension(input)),

  requestValidationFunction,
];

/**
 * @description Validates request with filename in the params.
 */
export const validateFilenameParam = [
  param('filename')
    .isString()
    .trim()
    .customSanitizer((input: string) => sanitize(input))
    .withMessage('Failed to sanitize the filename')
    .notEmpty()
    .withMessage('Filename was empty or contained only invalid characters')
    .customSanitizer((input: string) => ensureJsonExtension(input)),

  requestValidationFunction,
];
