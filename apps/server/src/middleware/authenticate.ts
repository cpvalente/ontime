import { LogOrigin } from 'ontime-types';

import express, { type Request, type Response, type NextFunction } from 'express';
import type { IncomingMessage } from 'node:http';
import type { WebSocket } from 'ws';
import { parse as parseCookie } from 'cookie';

import { hashPassword } from '../utils/hash.js';
import { srcFiles } from '../setup/index.js';
import { logger } from '../classes/Logger.js';
import { hashedPassword, hasPassword } from '../api-data/session/session.service.js';
import { getDataProvider } from '../classes/data-provider/DataProvider.js';

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

export const loginRouter = express.Router();

// serve static files at root
loginRouter.use('/', express.static(srcFiles.login));

// verify password and set cookies + redirect appropriately
loginRouter.post('/', async (req, res) => {
  res.clearCookie('token');
  const { password: reqPassword, redirect } = req.body;

  // Check global password
  if (hashPassword(reqPassword) === hashedPassword) {
    res.cookie('token', hashedPassword, {
      httpOnly: false, // allow websocket to access cookie
      secure: true,
      path: '/',
      sameSite: 'none',
    });
    // Set auth scope header before redirect
    res.setHeader('X-Auth-Scope', 'global');
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
  // and no presets have access keys
  const presets = getDataProvider().getUrlPresets();
  if (!hasPassword && !presets.some((p) => p.accessKey)) {
    return { authenticate: noopMiddleware, authenticateAndRedirect: noopMiddleware };
  }

  function authenticate(req: Request, res: Response, next: NextFunction) {
    // Check if this is a preset path
    const path = req.originalUrl.substring(1);
    const preset = presets.find((p) => p.alias === path && p.enabled);

    // If this is a preset with an access key
    if (preset?.accessKey) {
      const accessKey = req.query.key;
      if (accessKey === preset.accessKey) {
        // Set auth scope header for preset
        res.setHeader('X-Auth-Scope', `preset:${preset.alias}`);
        return next();
      }
    }

    // Otherwise check global auth
    const token = req.cookies?.token || req.query.token;
    if (token === hashedPassword) {
      // Set auth scope header for global auth
      res.setHeader('X-Auth-Scope', 'global');
      return next();
    }

    res.status(401).send('Unauthorized');
  }

  function authenticateAndRedirect(req: Request, res: Response, next: NextFunction) {
    // Allow access to specific public assets without authentication
    if (publicAssets.has(req.originalUrl)) {
      // Set auth scope header for public assets
      res.setHeader('X-Auth-Scope', 'public');
      return next();
    }

    // we shouldnt be here in the login route
    if (req.originalUrl.startsWith('/login')) {
      return next();
    }

    // Check if this is a preset path
    const path = req.originalUrl.substring(1);
    const preset = presets.find((p) => p.alias === path && p.enabled);

    // If this is a preset that requires an access key but none provided
    if (preset?.accessKey && !req.query.key) {
      // No redirect for preset auth, just 401
      res.status(401).send({
        error: 'Access key required',
        authType: 'preset',
        presetAlias: preset.alias,
      });
      return;
    }

    // Check global auth
    const token = req.cookies?.token || req.query.token;
    if (!token && hasPassword) {
      res.redirect(`${prefix}/login?redirect=${req.originalUrl}`);
      return;
    }

    next();
  }

  return { authenticate, authenticateAndRedirect };
}

/**
 * Middleware to authenticate a WebSocket connection
 */
export function authenticateSocket(_ws: WebSocket, req: IncomingMessage, next: (error?: Error) => void) {
  const presets = getDataProvider().getUrlPresets();
  if (!hasPassword && !presets.some((p) => p.accessKey)) {
    return next();
  }

  // Parse URL to check if this is a preset connection
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const path = url.pathname.substring(1);
  const preset = presets.find((p) => p.alias === path && p.enabled);

  // Check preset auth
  if (preset?.accessKey) {
    const accessKey = url.searchParams.get('key');
    if (accessKey === preset.accessKey) {
      return next();
    }
  }

  // Check global auth
  const cookieString = req.headers.cookie;
  if (typeof cookieString === 'string') {
    const cookies = parseCookie(cookieString);
    if (cookies.token === hashedPassword) {
      return next();
    }
  }

  // Check token in URL
  const token = url.searchParams.get('token');
  if (token === hashedPassword) {
    return next();
  }

  logger.warning(LogOrigin.Client, 'Unauthorized WebSocket connection attempt');
  return next(new Error('Unauthorized'));
}
