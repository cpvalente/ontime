import { isAlphanumeric } from 'ontime-utils';

import { Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';

import { ensureJsonExtension } from '../utils/fileManagement.js';

export const projectSanitiser = [
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

export const validateCustomField = [
  body('label')
    .exists()
    .isString()
    .trim()
    .custom((value) => {
      return isAlphanumeric(value);
    }),
  body('type').exists().isString().trim(),
  body('colour').exists().isString().trim(),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

export const validateEditCustomField = [
  param('label').exists().isString().trim(),
  body('label').exists().isString().trim(),
  body('type').exists().isString().trim(),
  body('colour').exists().isString().trim(),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

export const validateDeleteCustomField = [
  param('label').exists().isString(),

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
