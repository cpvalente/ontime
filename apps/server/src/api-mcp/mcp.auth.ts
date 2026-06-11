import type { NextFunction, Request, RequestHandler, Response } from 'express';

import { hasPassword, hashedPassword } from '../api-data/session/session.service.js';

/**
 * Wraps the app authenticate middleware with support for the Authorization header.
 * MCP clients conventionally authenticate with `Authorization: Bearer <token>`
 * rather than cookies or query params; any other request falls through to the
 * app middleware, keeping the behaviour of the shared middleware untouched.
 */
export function makeMcpAuthenticate(fallback: RequestHandler): RequestHandler {
  return function mcpAuthenticate(req: Request, res: Response, next: NextFunction) {
    if (hasPassword) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ') && authHeader.slice(7) === hashedPassword) {
        return next();
      }
    }
    return fallback(req, res, next);
  };
}
