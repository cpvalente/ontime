import { LogOrigin } from 'ontime-types';

import express, { type Request, type Response, type NextFunction } from 'express';
import type { IncomingMessage } from 'node:http';
import type { WebSocket } from 'ws';
import { parse as parseCookie } from 'cookie';

import { hashPassword } from '../utils/hash.js';
import { srcFiles } from '../setup/index.js';
import { logger } from '../classes/Logger.js';
// import { password } from '../externals.js';
const password = 'test';
import { noopMiddleware } from './noop.js';

export const hasPassword = Boolean(password);
const hashedPassword = hasPassword ? hashPassword(password) : '';

/**
 * List of public assets that can be accessed without authentication
 * should match the files in client/public
 */
const publicAssets = ['/favicon.ico', '/manifest.json', '/ontime-logo.png', '/robots.txt', '/site.webmanifest'];

export const loginRouter = express.Router();

// serve static files at root
loginRouter.use('/', express.static(srcFiles.login));

// verify password and set cookies + redirect appropriately
loginRouter.post('/', (req, res) => {
  res.clearCookie('token');
  const { password: reqPassword, redirect } = req.body;

  if (!hasPassword) {
    res.redirect(redirect || '/');
    return;
  }

  if (!reqPassword) {
    res.status(401).send('Unauthorized');
    return;
  }

  if (hashPassword(reqPassword) === hashedPassword) {
    res.cookie('token', hashedPassword, {
      httpOnly: false, // allow websocket to access cookie
      secure: true,
      path: '/', // allow cookie to be accessed from any path
      sameSite: 'strict',
    });
    res.redirect(redirect || '/');
    return;
  }

  res.status(401).send('Unauthorized');
});

/**
 * Express middleware to authenticate requests
 * @param {string} prefix - Prefix is used for the client hashes in Ontime Cloud
 */
export function makeAuthenticateMiddleware(prefix: string) {
  // we dont need to initialise the authenticate middleware if there is no password
  if (!hasPassword) {
    return { authenticate: noopMiddleware, authenticateAndRedirect: noopMiddleware };
  }

  function authenticate(req: Request, res: Response, next: NextFunction) {
    const token = req.query.token || req.cookies?.token;
    if (token && token === hashedPassword) {
      return next();
    }

    res.status(401).send('Unauthorized');
  }

  function authenticateAndRedirect(req: Request, res: Response, next: NextFunction) {
    // Allow access to specific public assets without authentication
    if (publicAssets.includes(req.originalUrl)) {
      return next();
    }

    if (req.originalUrl.startsWith('/login')) {
      // cannot authenticate the login route
      return next();
    }

    // we expect the token to be in the cookies
    if (req.cookies?.token === hashedPassword) {
      return next();
    }

    // we use query params for generating authenticated URLs and for clients like the companion module
    // if the user gives is a token in the query params, we set the cookie to be used in further requests
    if (req.query.token === hashedPassword) {
      res.cookie('token', hashedPassword, {
        httpOnly: false, // allow websocket to access cookie
        secure: true,
        path: '/', // allow cookie to be accessed from any path
        sameSite: 'strict',
      });
      return next();
    }

    const redirect = req.originalUrl.startsWith('/login')
      ? `${prefix}/login`
      : `${prefix}/login?redirect=${req.originalUrl}`;

    res.redirect(redirect);
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
    if (cookies.token === hashedPassword) {
      return next();
    }
  }

  // check if token is in the params
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const token = url.searchParams.get('token');
  if (token === hashedPassword) {
    return next();
  }

  logger.warning(LogOrigin.Client, 'Unauthorized WebSocket connection attempt');
  return next(new Error('Unauthorized'));
}
