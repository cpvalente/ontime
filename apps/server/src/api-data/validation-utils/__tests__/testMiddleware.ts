import type { NextFunction, Request, Response } from 'express';

/**
 * Exercises a single Express middleware (e.g. validateBody(schema)) against a minimal
 * fake req/res, without standing up supertest or a running app — matches this codebase's
 * convention of testing validation logic directly rather than through an HTTP layer.
 */
export function runMiddleware(
  middleware: (req: Request, res: Response, next: NextFunction) => void,
  req: Partial<Request>,
) {
  let statusCode: number | undefined;
  let payload: unknown;
  const res = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(data: unknown) {
      payload = data;
    },
  } as Response;

  let nextCalled = false;
  middleware(req as Request, res, () => {
    nextCalled = true;
  });

  return { nextCalled, statusCode, payload, req: req as Request };
}
