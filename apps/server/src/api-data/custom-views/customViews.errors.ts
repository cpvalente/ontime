import type { Response } from 'express';
import type { ErrorResponse } from 'ontime-types';
import { getErrorMessage } from 'ontime-utils';

export class CustomViewError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'CustomViewError';
  }
}

export function handleCustomViewsError(error: unknown, res: Response<ErrorResponse>) {
  if (error instanceof CustomViewError) {
    res.status(error.statusCode).send({ message: error.message });
    return;
  }

  res.status(500).send({ message: getErrorMessage(error) });
}
