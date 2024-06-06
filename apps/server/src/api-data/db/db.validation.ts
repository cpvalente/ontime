import { Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import { ensureJsonExtension } from '../../utils/fileManagement.js';
import sanitize from 'sanitize-filename';

/**
 * @description Validates request for a new project.
 */
export const validateNewProject = [
  body('title').optional().isString().trim(),
  body('description').optional().isString().trim(),
  body('publicUrl').optional().isString().trim(),
  body('publicInfo').optional().isString().trim(),
  body('backstageUrl').optional().isString().trim(),
  body('backstageInfo').optional().isString().trim(),
  body('endMessage').optional().isString().trim(),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

/**
 * @description Validates request for pathing data in the project.
 */
export const validatePatchProject = [
  body('rundown').isArray().optional({ nullable: false }),
  body('project').isObject().optional({ nullable: false }),
  body('settings').isObject().optional({ nullable: false }),
  body('viewSettings').isObject().optional({ nullable: false }),
  body('aliases').isArray().optional({ nullable: false }),
  body('customFields').isObject().optional({ nullable: false }),
  body('osc').isObject().optional({ nullable: false }),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

/**
 * @description Validates request with filename in the body.
 */
export const validateFilenameBody = [
  body('filename')
    .exists()
    .isString()
    .trim()
    .customSanitizer((input: string) => sanitize(input))
    .withMessage('Failed to sanitize the filename')
    .notEmpty()
    .withMessage('Filename was empty or contained only invalid characters')
    .customSanitizer((input: string) => ensureJsonExtension(input)),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    next();
  },
];

/**
 * @description Validates request with filename in the params.
 */
export const validateFilenameParam = [
  param('filename')
    .exists()
    .isString()
    .trim()
    .customSanitizer((input: string) => sanitize(input))
    .withMessage('Failed to sanitize the filename')
    .notEmpty()
    .withMessage('Filename was empty or contained only invalid characters')
    .customSanitizer((input: string) => ensureJsonExtension(input)),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    next();
  },
];
