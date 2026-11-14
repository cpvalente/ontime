import type { IncomingMessage } from 'node:http';

import { parse as parseCookie } from 'cookie';
import express, { Router, type NextFunction, type Request, type Response } from 'express';

import { hashedPassword } from '../api-data/session/session.service.js';
import { srcFiles } from '../setup/index.js';
import { hashPassword } from '../utils/hash.js';
import { Access, type AccessScope, getTokenScope } from './access.js';

/**
 * List of public assets that can be accessed without authentication
 * should match the files in client/public
 */
const publicAssets = new Set([
  '/favicon.ico',
  '/manifest.json',
  '/ontime-logo.png',
  '/ontime-logo-192.png',
  '/ontime-logo-512.png',
  '/robots.txt',
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
 * Returns the redirect target if it is a path within the prefix root, otherwise the prefix root
 * Rejects protocol-relative targets (eg: //host or /\host) which browsers resolve to another origin
 * @param {unknown} redirect - Redirect target as received from the login form
 * @param {string} prefix - Prefix is used for the client hashes in Ontime Cloud
 */
export function getSafeRedirect(redirect: unknown, prefix: string): string {
  const root = `${prefix}/`;
  if (typeof redirect !== 'string' || !redirect.startsWith(root) || redirect[1] === '/' || redirect[1] === '\\') {
    return root;
  }
  return redirect;
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
      setSessionCookie(res, hashedPassword, Access.write, prefix);
      res.redirect(getSafeRedirect(redirect, prefix));
      return;
    }

    res.status(401).send('Unauthorized');
  });

  return router;
}

/**
 * Express middleware to authenticate requests
 * Resolves the request scope into res.locals.scope, for scopedAccess to check
 * @param {string} prefix - Prefix is used for the client hashes in Ontime Cloud
 */
export function makeAuthenticateMiddleware(prefix: string) {
  // pre-compute the login redirect base URL to avoid string concatenation on every request
  const loginRedirectBase = `${prefix}/login?redirect=`;

  function authenticate(req: Request, res: Response, next: NextFunction) {
    const cookieToken = getTokenFromCookies(req.cookies);
    const scope = getTokenScope(getRequestToken(req));

    if (scope) {
      res.locals.scope = scope;
      return next();
    }

    // an invalid cookie would keep failing, so the next request can use its own token
    if (cookieToken && !getTokenScope(cookieToken)) {
      res.clearCookie('token', { path: prefix || '/' });
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

    const scope = getTokenScope(getRequestToken(req));
    if (!scope) {
      return res.redirect(loginRedirectBase + encodeURIComponent(req.originalUrl));
    }

    // we use query params for generating authenticated URLs and for clients like the companion module
    // a valid link token becomes the session cookie, unless the session already has write
    const urlToken = getTokenFromParams(req.query);
    if (urlToken && getTokenScope(getTokenFromCookies(req.cookies)) !== Access.write) {
      setSessionCookie(res, urlToken, scope, prefix);
    }
    next();
  }

  return { authenticate, authenticateAndRedirect };
}

/**
 * Resolves the scope of a WebSocket connection from a token in the URL, header or cookie
 * Undefined means the connection is not authorised
 */
export function authenticateSocket(req: IncomingMessage): AccessScope | undefined {
  return getTokenScope(
    getTokenFromParams(req.url, req.headers.host) ??
      getTokenFromCookies(req.headers.cookie) ??
      getTokenFromAuthHeader(req.headers.authorization),
  );
}

/**
 * Sets a cookie with the provided token
 * The client reads the scope to show what the session may do, the server never trusts it
 */
function setSessionCookie(res: Response, token: string, scope: AccessScope, prefix: string) {
  res.cookie('token', JSON.stringify({ token, scope: scope === Access.write ? 'rw' : 'ro' }), {
    httpOnly: false, // allow websocket to access cookie
    secure: true,
    path: prefix || '/', // allow cookie to be accessed from prefix path or root
    sameSite: 'none', // allow cookies to be sent in cross-origin requests (e.g., iframes)
  });
}

/**
 * The token a request authenticates with: the URL is explicit so it wins, then the cookie, then the header
 */
function getRequestToken(req: Request): string | undefined {
  return (
    getTokenFromParams(req.query) ??
    getTokenFromCookies(req.cookies) ??
    getTokenFromAuthHeader(req.headers.authorization)
  );
}

function getTokenFromCookies(cookies: string | Record<string, unknown> | undefined): string | undefined {
  const cookieContents = typeof cookies === 'string' ? parseCookie(cookies).token : cookies?.token;
  if (typeof cookieContents !== 'string') {
    return undefined;
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
