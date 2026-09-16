import type { NextFunction, Request, Response } from 'express';

import { trackActivity } from '../services/activity-service/activity.service.js';

/**
 * Marks the server as being in use.
 * Applied to the API routers so that hosted instances can tell
 * an idle stage from one which is being worked on over HTTP.
 */
export function trackActivityMiddleware(_req: Request, _res: Response, next: NextFunction) {
  trackActivity();
  next();
}
