import type { NextFunction, Request, Response } from 'express';
import { LogOrigin, type ErrorResponse } from 'ontime-types';
import { getErrorMessage } from 'ontime-utils';

import * as logger from '../api-data/logs/logs.service.js';
import { ConflictError, InvalidInputError, NotFoundError } from './errors.js';

function getStatusCode(error: unknown): number {
  if (error instanceof NotFoundError) return 404;
  if (error instanceof ConflictError) return 409;
  if (error instanceof InvalidInputError) return 422;
  return 500;
}

/**
 * Answers errors thrown by route handlers
 * Express identifies error middleware by its four parameters
 */
export function errorHandler(error: unknown, _req: Request, res: Response<ErrorResponse>, next: NextFunction) {
  // the response has started, only express can close it
  if (res.headersSent) {
    next(error);
    return;
  }

  const status = getStatusCode(error);
  if (status === 500) {
    logger.error(LogOrigin.Api, 'Data request failed', { status, error: getErrorMessage(error) });
    res.status(status).send({ message: 'Internal server error' });
    return;
  }

  res.status(status).send({ message: getErrorMessage(error) });
}
