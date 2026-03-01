import type { NextFunction, Request, Response } from 'express';

export function noopMiddleware(_req: Request, _res: Response, next: NextFunction) {
  next();
}
