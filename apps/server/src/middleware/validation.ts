import type { NextFunction, Request, Response } from 'express';
import { param, validationResult } from 'express-validator';

export const paramsWithId = [param('id').isString().trim().notEmpty(), requestValidationFunction];
type RequestWithFile = Request & { file?: unknown };

// #region operations on project rundowns =========================

/**
 * Runs validation and any error are sent with status 422
 */
export function requestValidationFunction(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ errors: errors.array() });
    return;
  }
  next();
}

/**
 * Runs validation and any error are sent with status 422
 * Also checks for the presses of a `file` in the body
 */
export function requestValidationFunctionWithFile(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ errors: errors.array() });
    return;
  }
  const request = req as RequestWithFile;
  // check that the file exists
  if (!request.file) {
    res.status(422).json({ errors: 'File not found' });
    return;
  }
  next();
}

// #endregion operations on project rundowns ======================
// #region operations on rundown entries ==========================

// #endregion operations on rundown entries =======================
