import type { NextFunction, Request, Response } from 'express';

import { hasPassword, hashedPassword, hashedReadPassword } from '../api-data/session/session.service.js';

/**
 * What a request or a socket may do
 * read: make GET requests and follow the show
 * write: everything, including sending commands
 */
export const Access = {
  read: 'read',
  write: 'write',
} as const;
export type AccessScope = (typeof Access)[keyof typeof Access];

/**
 * Resolves what a token grants, if anything
 * Without a password everyone may write
 * The hash of the session password grants write, the hash of the read password grants read
 */
export function getTokenScope(token: string | undefined): AccessScope | undefined {
  if (!hasPassword) {
    return Access.write;
  }

  if (!token) {
    return undefined;
  }

  if (token === hashedPassword) {
    return Access.write;
  }

  if (token === hashedReadPassword) {
    return Access.read;
  }

  return undefined;
}

/**
 * Express middleware checking the scope that authenticate resolved
 * - scopedAccess(Access.read): read tokens may make GET requests, anything else needs write
 * - scopedAccess(Access.write): only write tokens
 */
export function scopedAccess(required: AccessScope) {
  return function checkScope(req: Request, res: Response, next: NextFunction) {
    const { scope } = res.locals;
    if (scope === Access.write) {
      return next();
    }

    if (required === Access.read && scope === Access.read && (req.method === 'GET' || req.method === 'HEAD')) {
      return next();
    }

    res.status(403).send('Forbidden');
  };
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- augments the express types
  namespace Express {
    interface Locals {
      /** resolved by authenticate */
      scope?: AccessScope;
    }
  }
}
