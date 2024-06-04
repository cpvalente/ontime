import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import isValidFilename from 'valid-filename';

import { ensureJsonExtension } from '../../utils/fileManagement.js';

export const validateNewProjectFile = [
  body('title').optional().isString().trim(),
  body('description').optional().isString().trim(),
  body('publicUrl').optional().isString().trim(),
  body('publicInfo').optional().isString().trim(),
  body('backstageUrl').optional().isString().trim(),
  body('backstageInfo').optional().isString().trim(),
  body('endMessage').optional().isString().trim(),
  body('filename')
    .exists()
    .withMessage('Filename is required')
    .isString()
    .withMessage('Filename must be a string')
    .custom(throwIsValidFilename)
    .withMessage('Invalid file name'),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

export const sanitizeProjectFilename = (req: Request, _res: Response, next: NextFunction) => {
  const { filename, newFilename } = req.body;
  const { filename: projectName } = req.params;

  req.body.filename = ensureJsonExtension(filename);
  req.body.newFilename = ensureJsonExtension(newFilename);
  req.params.filename = ensureJsonExtension(projectName);

  next();
};

export const validatePatchProjectFile = [
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
 * @description Validates the filename for loading a project file.
 */
export const validateLoadProjectFile = [
  body('filename')
    .exists()
    .withMessage('Filename is required')
    .isString()
    .withMessage('Filename must be a string')
    .custom(throwIsValidFilename)
    .withMessage('Invalid file name'),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
    next();
  },
];

/**
 * @description Validates the filenames for duplicating a project.
 */
export const validateProjectDuplicate = [
  body('newFilename')
    .exists()
    .withMessage('New project filename is required')
    .isString()
    .withMessage('New project filename must be a string')
    .isLength({ min: 1, max: 255 })
    .withMessage('New project filename must be between 1 and 255 characters')
    .custom(throwIsValidFilename)
    .withMessage('Invalid file name'),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    next();
  },
];

/**
 * @description Validates the filenames for renaming a project.
 */
export const validateProjectRename = [
  body('newFilename')
    .exists()
    .withMessage('Duplicate project filename is required')
    .isString()
    .withMessage('Duplicate project filename must be a string')
    .isLength({ min: 1, max: 255 })
    .withMessage('Duplicate project filename must be between 1 and 255 characters')
    .custom(throwIsValidFilename)
    .withMessage('Invalid file name'),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    next();
  },
];

/**
 * @description Validates a download request which can include an optional project name.
 */
export const validateDownloadProject = [
  body('fileName').isString().optional(),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    next();
  },
];

function throwIsValidFilename(input: string, _meta) {
  if (!isValidFilename(input)) {
    throw new Error('invalid filename');
  }
}
