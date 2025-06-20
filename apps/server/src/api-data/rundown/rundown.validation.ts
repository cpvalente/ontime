import { body, param, validationResult } from 'express-validator';
import type { Request, Response, NextFunction } from 'express';

export const rundownPostValidator = [
  body('type').isString().exists().isIn(['event', 'delay', 'block']),
  body('after').optional().isString(),
  body('before').optional().isString(),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

export const rundownPutValidator = [
  body('id').isString().exists(),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

export const rundownBatchPutValidator = [
  body('data').isObject().exists(),
  body('ids').isArray().exists(),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

export const rundownReorderValidator = [
  body('eventId').isString().exists(),
  body('from').isNumeric().exists(),
  body('to').isNumeric().exists(),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

export const rundownSwapValidator = [
  body('from').isString().exists(),
  body('to').isString().exists(),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

export const paramsMustHaveEventId = [
  param('eventId').exists(),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];

export const rundownArrayOfIds = [
  body('ids').isArray().exists(),
  body('ids.*').isString(),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
    next();
  },
];
