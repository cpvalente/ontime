import type { IncomingMessage } from 'node:http';

import { parse as parseCookie } from 'cookie';
import express, { Router, type NextFunction, type Request, type Response } from 'express';
import type { WebSocket } from 'ws';

import { hasPassword, hashedPassword } from '../api-data/session/session.service.js';
import { srcFiles } from '../setup/index.js';
import { hashPassword } from '../utils/hash.js';
import { noopMiddleware } from './noop.js';

/**
 * List of public assets that can be accessed without authentication
 * should match the files in client/public
 */
const publicAssets = new Set([
  '/favicon.ico',
  '/manifest.json',
  '/ontime-logo.png',
  '/robots.txt',
  '/site.webmanifest',
]);

export function isPublicAssetRequest(originalUrl: string, prefix: string): boolean {
  const pathname = originalUrl.split('?')[0];

  if (publicAssets.has(pathname)) {
    return true;
  }

  if (prefix && pathname.startsWith(prefix)) {
    return publicAssets.has(pathname.slice(prefix.length) || '/');
  }

  return false;
}

/**
 * Creates a login router with the provided prefix
 * @param {string} prefix - Prefix is used for the client hashes in Ontime Cloud
 */
export function makeLoginRouter(prefix: string) {
  const router: Router = express.Router();

  // serve static files at root
  router.use('/', express.static(srcFiles.login));

  // verify password and set cookies + redirect appropriately
  router.post('/', (req, res) => {
    res.clearCookie('token', { path: prefix || '/' });
    const { password: reqPassword, redirect } = req.body;

    if (hashPassword(reqPassword) === hashedPassword) {
      setSessionCookie(res, hashedPassword, prefix);
      // If redirect is provided, use it; otherwise redirect to the prefix root
      res.redirect(redirect || (prefix ? `${prefix}/` : '/'));
      return;
    }

    res.status(401).send('Unauthorized');
  });

  return router;
}

/**
 * Express middleware to authenticate requests
 * @param {string} prefix - Prefix is used for the client hashes in Ontime Cloud
 */
export function makeAuthenticateMiddleware(prefix: string) {
  // we dont need to initialise the authenticate middleware if there is no password
  if (!hasPassword) {
    return { authenticate: noopMiddleware, authenticateAndRedirect: noopMiddleware };
  }

  // pre-compute the login redirect base URL to avoid string concatenation on every request
  const loginRedirectBase = `${prefix}/login?redirect=`;

  function authenticate(req: Request, res: Response, next: NextFunction) {
    if (getTokenFromCookies(req.cookies) === hashedPassword) {
      return next();
    }

    if (getTokenFromAuthHeader(req.headers.authorization) === hashedPassword) {
      return next();
    }

    if (getTokenFromParams(req.query) === hashedPassword) {
      return next();
    }

    res.status(401).send('Unauthorized');
  }

  function authenticateAndRedirect(req: Request, res: Response, next: NextFunction) {
    // Allow access to specific public assets without authentication
    if (isPublicAssetRequest(req.originalUrl, prefix)) {
      return next();
    }

    // we shouldnt be here in the login route
    const loginPath = prefix ? `${prefix}/login` : '/login';
    if (req.originalUrl.startsWith(loginPath)) {
      return next();
    }

    if (getTokenFromCookies(req.cookies) === hashedPassword) {
      return next();
    }

    if (getTokenFromAuthHeader(req.headers.authorization) === hashedPassword) {
      return next();
    }

    // we use query params for generating authenticated URLs and for clients like the companion module
    // if the user gives is a token in the query params, we set the cookie to be used in further requests
    if (getTokenFromParams(req.query) === hashedPassword) {
      if (hashedPassword !== undefined) {
        setSessionCookie(res, hashedPassword, prefix);
      }
      return next();
    }

    res.redirect(loginRedirectBase + req.originalUrl);
  }

  return { authenticate, authenticateAndRedirect };
}

/**
 * Middleware to authenticate a WebSocket connection with a token in the cookie
 */
export function authenticateSocket(_ws: WebSocket, req: IncomingMessage, next: (error?: Error) => void) {
  if (!hasPassword) {
    return next();
  }

  if (getTokenFromCookies(req.headers.cookie) === hashedPassword) {
    return next();
  }

  if (getTokenFromAuthHeader(req.headers.authorization) === hashedPassword) {
    return next();
  }

  if (getTokenFromParams(req.url, req.headers.host) === hashedPassword) {
    return next();
  }

  return next(new Error('Unauthorized'));
}

/**
 * Sets a cookie with the provided token
 * We currently add a full 'rw' permission scope, this should be filtered when dealing with presets
 */
function setSessionCookie(res: Response, token: string, prefix: string) {
  res.cookie('token', JSON.stringify({ token, scope: 'rw' }), {
    httpOnly: false, // allow websocket to access cookie
    secure: true,
    path: prefix || '/', // allow cookie to be accessed from prefix path or root
    sameSite: 'none', // allow cookies to be sent in cross-origin requests (e.g., iframes)
  });
}

function getTokenFromCookies(cookies: string | Record<string, unknown> | undefined): string | undefined {
  const cookieContents = typeof cookies === 'string' ? parseCookie(cookies).token : cookies?.token;
  if (typeof cookieContents !== 'string') {
    return undefined;
  }

  // Fast path: avoid JSON parsing when the expected token can be found directly
  const cookieTokenString = '"token":"' + hashedPassword + '"';
  if (cookieTokenString && cookieContents.includes(cookieTokenString)) {
    return hashedPassword;
  }

  try {
    const cookie = JSON.parse(cookieContents);
    if (cookie && typeof cookie.token === 'string') {
      return cookie.token;
    }
  } catch (_) {
    // no error handling to do here
  }
}

function getTokenFromAuthHeader(authorization: string | undefined): string | undefined {
  return authorization?.match(/^Bearer\s+(\S+)\s*$/i)?.[1];
}

function getTokenFromParams(params: string | Record<string, unknown> | undefined, host?: string): string | undefined {
  if (typeof params !== 'string') {
    return typeof params?.token === 'string' ? params.token : undefined;
  }

  try {
    return new URL(params, `http://${host}`).searchParams.get('token') ?? undefined;
  } catch (_) {
    return undefined;
  }
}
