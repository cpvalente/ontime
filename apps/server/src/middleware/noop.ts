import type { Request, Response, NextFunction } from 'express';

export function noopMiddleware(_req: Request, _res: Response, next: NextFunction) {
  next();
}
