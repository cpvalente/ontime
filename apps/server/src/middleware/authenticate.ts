import express, { type NextFunction, type Request, type Response } from 'express';
import type { IncomingMessage } from 'node:http';
import type { WebSocket } from 'ws';
import { parse as parseCookie } from 'cookie';

import { hashPassword } from '../utils/hash.js';
import { srcFiles } from '../setup/index.js';
import { hasPassword, hashedPassword } from '../api-data/session/session.service.js';

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

/**
 * Creates a login router with the provided prefix
 * @param {string} prefix - Prefix is used for the client hashes in Ontime Cloud
 */
export function makeLoginRouter(prefix: string) {
  const router = express.Router();

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
    if (req.query.token) {
      if (req.query.token === hashedPassword) {
        return next();
      }
    }

    if (req.cookies?.token) {
      const tokenFromCookie = getTokenFromCookie(req.cookies.token);
      if (tokenFromCookie === hashedPassword) {
        return next();
      }
    }

    res.status(401).send('Unauthorized');
  }

  function authenticateAndRedirect(req: Request, res: Response, next: NextFunction) {
    // Allow access to specific public assets without authentication
    if (publicAssets.has(req.originalUrl)) {
      return next();
    }

    // we shouldnt be here in the login route
    const loginPath = prefix ? `${prefix}/login` : '/login';
    if (req.originalUrl.startsWith(loginPath)) {
      return next();
    }

    // we expect the token to be in the cookies
    if (req.cookies?.token) {
      const tokenFromCookie = getTokenFromCookie(req.cookies.token);
      if (tokenFromCookie === hashedPassword) {
        return next();
      }
    }

    // we use query params for generating authenticated URLs and for clients like the companion module
    // if the user gives is a token in the query params, we set the cookie to be used in further requests
    if (req.query.token === hashedPassword) {
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

  // check if the token is in the cookie
  const cookieString = req.headers.cookie;
  if (typeof cookieString === 'string') {
    const cookies = parseCookie(cookieString);
    if (cookies.token) {
      const token = getTokenFromCookie(cookies.token);
      if (token === hashedPassword) {
        return next();
      }
    }
  }

  // check if token is in the params - simple string check first
  const urlString = req.url || '';
  if (urlString.includes(`token=${hashedPassword}`)) {
    return next();
  }

  // fallback to full URL parsing for other formats
  try {
    const url = new URL(urlString, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    if (token === hashedPassword) {
      return next();
    }
  } catch (_) {
    // ignore URL parsing errors
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

/**
 * When calling this function we already know a cookie called 'token' exists
 * And want to extract its value
 */
function getTokenFromCookie(cookieContents: string): string | undefined {
  // Fast path: check if the hashed password is directly in the cookie string
  // This avoids JSON parsing for the common case
  const cookieTokenString = '"token":"' + hashedPassword + '}"';
  if (cookieTokenString && cookieContents.includes(cookieTokenString)) {
    return hashedPassword;
  }

  // Fallback to JSON parsing for other cases or validation
  try {
    const cookie = JSON.parse(cookieContents);
    if (cookie && typeof cookie.token === 'string') {
      return cookie.token;
    }
  } catch (_) {
    // no error handling to do here
  }
}
