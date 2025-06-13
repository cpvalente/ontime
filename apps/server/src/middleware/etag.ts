import type { NextFunction, Request, Response } from 'express';

/**
 * send 304 if the etag matches
 */
export function ifNoneMatch(req: Request, res: Response, next: NextFunction, currentRevision: number) {
  const etag = req.headers['if-none-match'];
  res.setHeader('etag', currentRevision);
  if (etag === currentRevision.toString()) {
    res.status(304).send();
    return;
  }
  next();
}
