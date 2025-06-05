import { body, param, validationResult } from 'express-validator';
import type { Request, Response, NextFunction } from 'express';

export const rundownPostValidator = [
  body('type').isString().isIn(['event', 'delay', 'block']),
  body('after').optional().isString(),
  body('before').optional().isString(),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

export const rundownPutValidator = [
  body('id').isString().notEmpty(),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

export const rundownBatchPutValidator = [
  body('data').isObject(),
  body('ids').isArray().notEmpty(),
  body('ids.*').isString(),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

export const rundownReorderValidator = [
  body('entryId').isString().notEmpty(),
  body('destinationId').isString().notEmpty(),
  body('order').isIn(['before', 'after', 'insert']),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

export const rundownSwapValidator = [
  body('from').isString().notEmpty(),
  body('to').isString().notEmpty(),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

export const paramsMustHaveEntryId = [
  param('entryId').isString().notEmpty(),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

export const rundownArrayOfIds = [
  body('ids').isArray().notEmpty(),
  body('ids.*').isString(),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];
